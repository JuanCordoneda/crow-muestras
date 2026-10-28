"""Amplía las fotos con Real-ESRGAN para que no se vean pixeladas en pantallas retina.

Las fotos del restaurante llegan chicas (640–1600 px) y la web las muestra a pantalla completa en
teléfonos de 3x: sin esto el navegador las estira hasta 3 veces. Aquí se amplían con la red
(x4 para las de menos de 1000 px, x2 para el resto) y se guardan en PNG sin pérdida; después
`imagenes.sh` saca las webp de 800, 1400 y 2000 px.

Uso:
  python3 mejorar_fotos.py <carpeta_originales> <carpeta_salida> <carpeta_modelos> [nombre ...]

Modelos (oficiales de xinntao/Real-ESRGAN), en <carpeta_modelos>:
  RealESRGAN_x4plus.pth  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
  RealESRGAN_x2plus.pth  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth
"""
import pathlib
import sys
import time

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torch import nn


# ---- RRDBNet (la arquitectura de Real-ESRGAN, sin depender de basicsr) ----
class ResidualDenseBlock(nn.Module):
    def __init__(self, nf=64, gc=32):
        super().__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, inplace=True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, nf, gc=32):
        super().__init__()
        self.rdb1 = ResidualDenseBlock(nf, gc)
        self.rdb2 = ResidualDenseBlock(nf, gc)
        self.rdb3 = ResidualDenseBlock(nf, gc)

    def forward(self, x):
        return self.rdb3(self.rdb2(self.rdb1(x))) * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, scale, nf=64, nb=23, gc=32):
        super().__init__()
        self.scale = scale
        in_ch = 3 * (4 if scale == 2 else 1)
        self.conv_first = nn.Conv2d(in_ch, nf, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(nf, gc) for _ in range(nb)])
        self.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_last = nn.Conv2d(nf, 3, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, inplace=True)

    def forward(self, x):
        feat = F.pixel_unshuffle(x, 2) if self.scale == 2 else x
        feat = self.conv_first(feat)
        feat = feat + self.conv_body(self.body(feat))
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode="nearest")))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode="nearest")))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


def load(models, scale, device):
    net = RRDBNet(scale)
    # weights_only: el .pth solo puede traer tensores, nunca código
    state = torch.load(models / f"RealESRGAN_x{scale}plus.pth", map_location="cpu", weights_only=True)
    net.load_state_dict(state.get("params_ema", state), strict=True)
    return net.eval().to(device)


@torch.no_grad()
def upscale(net, img, scale, device, tile=192, pad=12):
    """Procesa por mosaicos (con margen) para no agotar la memoria."""
    x = torch.from_numpy(np.asarray(img, dtype=np.float32) / 255.0).permute(2, 0, 1)[None]
    _, _, h, w = x.shape
    # x2plus trabaja a media resolución: el lado tiene que ser par
    ph, pw = h % 2, w % 2
    if ph or pw:
        x = F.pad(x, (0, pw, 0, ph), mode="reflect")
    H, W = x.shape[2], x.shape[3]
    out = torch.zeros(1, 3, H * scale, W * scale)
    for y0 in range(0, H, tile):
        for x0 in range(0, W, tile):
            y1, x1 = min(y0 + tile, H), min(x0 + tile, W)
            ya, xa = max(y0 - pad, 0), max(x0 - pad, 0)
            yb, xb = min(y1 + pad, H), min(x1 + pad, W)
            # recortes de lado par para x2plus
            if scale == 2:
                ya -= ya % 2
                xa -= xa % 2
                yb += yb % 2 if yb < H else 0
                xb += xb % 2 if xb < W else 0
            piece = net(x[:, :, ya:yb, xa:xb].to(device)).cpu()
            out[:, :, y0 * scale:y1 * scale, x0 * scale:x1 * scale] = piece[
                :, :, (y0 - ya) * scale:(y0 - ya + y1 - y0) * scale, (x0 - xa) * scale:(x0 - xa + x1 - x0) * scale]
    out = out[:, :, :h * scale, :w * scale].clamp(0, 1)
    return Image.fromarray((out[0].permute(1, 2, 0).numpy() * 255.0).round().astype(np.uint8))


def main():
    src, dst, models = (pathlib.Path(a) for a in sys.argv[1:4])
    only = set(sys.argv[4:])
    dst.mkdir(parents=True, exist_ok=True)
    device = "cpu"
    nets = {}
    for f in sorted(src.iterdir()):
        if f.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp") or (only and f.stem not in only):
            continue
        out = dst / f"{f.stem}.png"
        if out.exists():
            continue
        img = Image.open(f).convert("RGB")
        scale = 4 if max(img.size) < 1000 else 2
        nets.setdefault(scale, load(models, scale, device))
        t = time.time()
        big = upscale(nets[scale], img, scale, device)
        big.save(out, optimize=False)
        print(f"{f.name}: {img.size[0]}x{img.size[1]} → x{scale} {big.size[0]}x{big.size[1]} ({time.time() - t:.0f} s)", flush=True)


if __name__ == "__main__":
    main()
