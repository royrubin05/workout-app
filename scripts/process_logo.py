
import sys
from PIL import Image
import numpy as np

def process_logo(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)

    # 1. Threshold for black background removal (allow small variance for compression artifacts)
    # Target color: Black (0,0,0)
    # We'll treat anything very dark as transparency
    threshold = 30 
    red, green, blue, alpha = data.T
    
    # Identify black pixels
    black_areas = (red < threshold) & (green < threshold) & (blue < threshold)
    
    # Set alpha to 0 for black areas
    data[..., 3][black_areas.T] = 0
    
    img_transparent = Image.fromarray(data)

    # 2. Crop to content
    bbox = img_transparent.getbbox()
    if bbox:
        img_cropped = img_transparent.crop(bbox)
    else:
        img_cropped = img_transparent

    # 3. Center in a square canvas
    # Determine new size (max dimension of crop)
    w, h = img_cropped.size
    new_size = max(w, h)
    # Add some padding (e.g., 10%)
    padding = int(new_size * 0.1)
    final_size = new_size + (padding * 2)
    
    final_img = Image.new("RGBA", (final_size, final_size), (0, 0, 0, 0))
    
    # Calculate centering position
    # Visual centering: The triangle might look better if slightly shifted up? 
    # For now, strict geometric centering.
    x_pos = (final_size - w) // 2
    y_pos = (final_size - h) // 2
    
    final_img.paste(img_cropped, (x_pos, y_pos))
    
    # Resize to 512x512
    final_img = final_img.resize((512, 512), Image.Resampling.LANCZOS)
    
    print(f"Saving to {output_path}")
    final_img.save(output_path, "PNG")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_logo.py <input> <output>")
        sys.exit(1)
    
    process_logo(sys.argv[1], sys.argv[2])
