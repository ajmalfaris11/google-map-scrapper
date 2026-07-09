from PIL import Image, ImageDraw

def make_round(img_path):
    try:
        img = Image.open(img_path).convert("RGBA")
        w, h = img.size
        min_dim = min(w, h)
        
        left = (w - min_dim)/2
        top = (h - min_dim)/2
        right = (w + min_dim)/2
        bottom = (h + min_dim)/2
        img = img.crop((left, top, right, bottom))
        
        mask = Image.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, min_dim, min_dim), fill=255)
        
        rounded = Image.new("RGBA", img.size, (0,0,0,0))
        rounded.paste(img, (0,0), mask=mask)
        
        rounded.save(img_path)
        print(f"Rounded {img_path}")
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

make_round("apps/dashboard/public/logo.png")
make_round("apps/dashboard/src/app/icon.png")
