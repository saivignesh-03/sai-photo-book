"""Discover photographs and create a catalog, preserving all original image files."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
CATEGORIES = {'nature': 'Nature', 'landscapes': 'Landscapes', 'life': 'Life', 'recent': 'Latest frames'}
WEB_IMAGES = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'}
APPLE_IMAGES = {'.heic', '.heif'}


def metadata(image: Path) -> dict:
    sidecar = image.with_name(image.name + '.json')
    if not sidecar.is_file():
        sidecar = image.with_suffix('.json')
    if not sidecar.is_file() or sidecar.is_symlink():
        return {}
    try:
        data = json.loads(sidecar.read_text(encoding='utf-8'))
        return data if isinstance(data, dict) else {}
    except (ValueError, OSError) as error:
        print(f'Note: ignoring invalid details in {sidecar.name}: {error}', file=sys.stderr)
        return {}


def web_image(image: Path, root: Path) -> Path | None:
    if image.suffix.lower() not in APPLE_IMAGES:
        return image
    try:
        from PIL import Image, ImageOps
        from pillow_heif import register_heif_opener
    except ImportError:
        print('HEIC support needs: python -m pip install -r requirements.txt', file=sys.stderr)
        return None
    # Checkout timestamps change on GitHub runners; image content does not.
    with image.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    signature = f'pillow-v2:{image.relative_to(root).as_posix()}:{digest}'
    name = hashlib.sha256(signature.encode()).hexdigest()[:28] + '.jpg'
    preview = root / '.photobook-cache' / 'previews' / name
    if preview.is_file() and preview.stat().st_size:
        return preview
    preview.parent.mkdir(parents=True, exist_ok=True)
    temporary = preview.with_name(preview.stem + '.tmp.jpg')
    try:
        register_heif_opener(thumbnails=False)
        with Image.open(image) as original:
            converted = ImageOps.exif_transpose(original).convert('RGB')
            converted.thumbnail((2400, 2400))
            converted.save(temporary, format='JPEG', quality=88, optimize=True)
        temporary.replace(preview)
    except (OSError, ValueError) as error:
        temporary.unlink(missing_ok=True)
        print(f'Note: could not create preview for {image.name}: {error}', file=sys.stderr)
        return None
    return preview


def scan(root: Path, category: str) -> list:
    folder = root / 'photos' / category
    folder.mkdir(parents=True, exist_ok=True)
    photos = []
    for image in sorted(folder.rglob('*')):
        if image.is_symlink() or not image.is_file() or image.suffix.lower() not in WEB_IMAGES | APPLE_IMAGES:
            continue
        if not image.resolve().is_relative_to(folder.resolve()):
            continue
        try:
            stat = image.stat()
            if not stat.st_size:
                continue
            source = web_image(image, root)
            if source is None:
                continue
            details = metadata(image)
            def field(key, default=''):
                value = details.get(key, default)
                return value.strip() if isinstance(value, str) else default
            title = re.sub(r'[-_]+', ' ', image.stem).strip().capitalize()
            if re.match(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-', image.stem):
                title = 'A landscape moment' if category == 'landscapes' else f'A moment in {CATEGORIES[category].lower()}'
            label = field('category') if category == 'recent' else category
            if label not in CATEGORIES:
                label = category
            path = '/'.join(quote(part, safe='') for part in source.relative_to(root).parts)
            version = source.stem if image.suffix.lower() in APPLE_IMAGES else str(stat.st_mtime_ns)
            photos.append({
                'id': f'{category}/{image.relative_to(folder).as_posix()}',
                'category': label, 'source': category,
                'title': field('title', title),
                'image': path + f'?v={version}',
                'alt': field('alt', f'Sai’s photograph from {CATEGORIES[label]}'),
                'story': field('story'), 'camera': field('camera'),
                'recent': details.get('recent', True) is True,
                'sample': False, '_sort': stat.st_mtime_ns,
            })
        except FileNotFoundError:
            continue
    return photos


def discover(root: Path = ROOT) -> dict:
    photos = [photo for category in ('nature', 'landscapes', 'life') for photo in scan(root, category)]
    recent = scan(root, 'recent')
    photos.sort(key=lambda photo: (-photo['_sort'], photo['id']))
    recent.sort(key=lambda photo: (-photo['_sort'], photo['id']))
    for photo in photos + recent:
        photo.pop('_sort')
    return {'photos': photos, 'recentPhotos': recent or [photo for photo in photos if photo.get('recent')], 'localCount': len(photos), 'recentFolderCount': len(recent)}


def build(root: Path = ROOT) -> dict:
    catalog = discover(root)
    text = json.dumps(catalog, ensure_ascii=False, indent=2)
    outputs = {'catalog.json': text + '\n', 'photos.js': '// Generated by build_gallery.py. Add photos to the folders; details go in matching JSON sidecars.\nwindow.PHOTO_BOOK_CATALOG = ' + text.replace('<', '\\u003c') + ';\n'}
    for name, value in outputs.items():
        path = root / name
        if not path.exists() or path.read_text(encoding='utf-8') != value:
            temporary = path.with_name(path.name + '.tmp')
            temporary.write_text(value, encoding='utf-8')
            temporary.replace(path)
    return catalog


if __name__ == '__main__':
    data = build()
    print(f"Photo book updated: {data['localCount']} personal collection photos, {data['recentFolderCount']} recent-folder photos.")
