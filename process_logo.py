from PIL import Image, ImageDraw
import math

def process_image(src_path, dest_path):
    # Open original image
    img = Image.open(src_path).convert("RGBA")
    
    # Get bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    w, h = img.size
    
    # We want to place this inside a white circle.
    # The circle must contain the bounding box.
    # The diagonal of the image should ideally fit within the circle diameter,
    # but since logos are often circular or rectangular, fitting the max dimension is usually safer
    # Actually, if we want to maximize size, the diagonal of the image bounding box shouldn't exceed the circle diameter.
    diameter = math.ceil(math.sqrt(w**2 + h**2))
    
    # Let's make the final image 512x512
    final_size = 512
    
    # Scale the image so its diagonal fits inside the 512 circle (minus a small margin)
    margin = 20
    target_diameter = final_size - margin * 2
    
    # Scale factor
    scale = target_diameter / diameter
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create the final square image with transparent background
    final = Image.new("RGBA", (final_size, final_size), (0,0,0,0))
    
    # Draw white circle
    mask = Image.new("L", (final_size, final_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, final_size, final_size), fill=255)
    
    white_bg = Image.new("RGBA", (final_size, final_size), (255,255,255,255))
    final.paste(white_bg, (0,0), mask=mask)
    
    # Paste logo in the center
    paste_x = (final_size - new_w) // 2
    paste_y = (final_size - new_h) // 2
    
    final.paste(img, (paste_x, paste_y), mask=img)
    
    final.save(dest_path)
    print(f"Processed and saved to {dest_path}")

process_image("apps/dashboard/public/logo.png", "apps/dashboard/public/logo.png")
process_image("apps/dashboard/public/logo.png", "apps/dashboard/src/app/icon.png")
