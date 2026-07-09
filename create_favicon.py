from PIL import Image, ImageDraw

def create_optimized_icons(src_path, dest_ico_path, dest_png_path):
    # Open original image
    img = Image.open(src_path).convert("RGBA")
    
    # Crop exactly to non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    w, h = img.size
    
    # Base size for the largest PNG icon
    final_size = 512
    
    # Maximize size safely: the largest dimension should be 65% of the circle diameter to prevent clipping on diagonals
    target_dim = final_size * 0.65
    scale = target_dim / max(w, h)
    
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    # High-quality resize
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create final transparent canvas
    final = Image.new("RGBA", (final_size, final_size), (0,0,0,0))
    
    # Draw white circle
    mask = Image.new("L", (final_size, final_size), 0)
    draw = ImageDraw.Draw(mask)
    # Anti-aliased circle
    draw.ellipse((0, 0, final_size, final_size), fill=255)
    
    white_bg = Image.new("RGBA", (final_size, final_size), (255,255,255,255))
    final.paste(white_bg, (0,0), mask=mask)
    
    # Paste centered logo
    paste_x = (final_size - new_w) // 2
    paste_y = (final_size - new_h) // 2
    final.paste(img, (paste_x, paste_y), mask=img)
    
    # Save standard PNG icon
    final.save(dest_png_path, format="PNG")
    print(f"Created optimized icon.png at {dest_png_path}")
    
    # Downscale and save as ICO with multiple sizes for sharpness at small scales
    icon_sizes = [(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)]
    final.save(dest_ico_path, format="ICO", sizes=icon_sizes)
    print(f"Created multi-size favicon.ico at {dest_ico_path}")

create_optimized_icons(
    "apps/dashboard/public/logo.png", 
    "apps/dashboard/src/app/favicon.ico", 
    "apps/dashboard/src/app/icon.png"
)
