import os
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

def create_icon():
    # 1. Download the dragon image
    url = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Kali-dragon-icon.svg/1024px-Kali-dragon-icon.svg.png"
    print(f"Downloading dragon icon from {url}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to download image: {response.status_code}")
        # Backup URL: Google Noto Emoji (512x512)
        url2 = "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u1f409.png"
        print(f"Downloading backup from {url2}...")
        resp2 = requests.get(url2)
        if resp2.status_code == 200:
            img = Image.open(BytesIO(resp2.content)).convert("RGBA")
            # Resize to 800x800 (upscaling slightly)
            img = img.resize((800, 800), Image.Resampling.LANCZOS)
        else:
            print(f"Backup failed too: {resp2.status_code}")
            # Try Twemoji as last resort
            url3 = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f409.png"
            resp3 = requests.get(url3)
            if resp3.status_code == 200:
                img = Image.open(BytesIO(resp3.content)).convert("RGBA")
                img = img.resize((800, 800), Image.Resampling.NEAREST)
            else:
                return
    else:
        # 2. Open image
        img = Image.open(BytesIO(response.content)).convert("RGBA")
    
    # 3. Create a new background image (1024x1024) with Dragon Fruit Pink
    # Color: #C71585 (MediumVioletRed) or #FF00FF (Magenta) or #E23D75 (Dragon Fruit flesh/skin)
    bg_color = (199, 21, 133, 255) # #C71585
    icon_size = (1024, 1024)
    new_icon = Image.new("RGBA", icon_size, bg_color)
    
    # 4. Process the downloaded image
    # The image is a blue circle with white dragon.
    # We want to remove the blue circle if possible, or just use it.
    # It's easier to just composite it if it looks good.
    # But Blue on Pink might look bad.
    # Let's try to replace Blue with Transparent or Pink.
    # The blue is roughly (45, 140, 240) based on visual inspection of Kali Linux logo.
    # Let's just resize it to fit in the center and see.
    
    # Resize to 800x800 to leave padding
    img.thumbnail((800, 800), Image.Resampling.LANCZOS)
    
    # Center it
    offset = ((icon_size[0] - img.size[0]) // 2, (icon_size[1] - img.size[1]) // 2 - 100) # Move up a bit
    
    # 5. Composite
    # To remove the blue circle, we can use a mask? 
    # Actually, the Kali logo IS the blue circle.
    # Let's just draw "TS" on top of it?
    # Or maybe we can find a better image.
    # Let's try to use the image as is, but maybe crop the dragon?
    # Too complex.
    # Let's simply place the image.
    new_icon.paste(img, offset, img)
    
    # 6. Add "TS" text
    draw = ImageDraw.Draw(new_icon)
    try:
        # Try to load a font. default is usually small.
        # On Windows, we can use arial.ttf
        font_path = "C:\\Windows\\Fonts\\arialbd.ttf" # Arial Bold
        font = ImageFont.truetype(font_path, 250)
    except IOError:
        font = ImageFont.load_default()
        print("Could not load Arial Bold, using default font.")

    text = "TS"
    # Calculate text size using textbbox (for Pillow >= 9.2.0) or textsize
    try:
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        text_width = right - left
        text_height = bottom - top
    except AttributeError:
        text_width, text_height = draw.textsize(text, font=font)

    # Position text at the bottom center
    text_x = (icon_size[0] - text_width) // 2
    text_y = icon_size[1] - text_height - 150
    
    # Draw text with shadow/outline for visibility
    # Shadow
    shadow_color = (0, 0, 0, 128)
    draw.text((text_x + 5, text_y + 5), text, font=font, fill=shadow_color)
    
    # Text
    text_color = (255, 255, 255, 255)
    draw.text((text_x, text_y), text, font=font, fill=text_color)
    
    # 7. Save
    output_dir = r"C:\Users\Sachzie\Downloads\dragons-vision\mobile\assets"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    icon_path = os.path.join(output_dir, "icon.png")
    adaptive_path = os.path.join(output_dir, "adaptive-icon.png")
    
    new_icon.save(icon_path)
    print(f"Saved {icon_path}")
    
    new_icon.save(adaptive_path)
    print(f"Saved {adaptive_path}")

if __name__ == "__main__":
    create_icon()
