import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image,ImageStat
from pillow_heif import register_heif_opener
from build_gallery import build,discover

class GalleryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
    def tearDown(self):self.temp.cleanup()
    def photo(self,category,name):
        p=self.root/'photos'/category/name;p.parent.mkdir(parents=True,exist_ok=True)
        Image.new('RGB',(24,12),(30,140,210)).save(p)
        return p
    def test_add_remove_and_filename_encoding(self):
        p=self.photo('landscapes','my view #1.jpg')
        catalog=build(self.root)
        self.assertEqual(catalog['localCount'],1)
        self.assertIn('my%20view%20%231.jpg',catalog['photos'][0]['image'])
        p.unlink();self.assertEqual(build(self.root)['localCount'],0)
    def test_heic_conversion_is_visible_cached_and_preserves_original(self):
        register_heif_opener()
        p=self.root/'photos/landscapes/view.heic';p.parent.mkdir(parents=True)
        Image.new('RGB',(32,16),(40,150,220)).save(p)
        original=hashlib.sha256(p.read_bytes()).digest()
        first=build(self.root);second=build(self.root)
        self.assertEqual(first,second)
        self.assertEqual(hashlib.sha256(p.read_bytes()).digest(),original)
        preview=next((self.root/'.photobook-cache/previews').glob('*.jpg'))
        with Image.open(preview) as im:self.assertGreater(max(ImageStat.Stat(im).mean),100)
        self.assertFalse(first['photos'][0]['sample'])
    def test_sidecar_and_invalid_sidecar(self):
        p=self.photo('nature','tree.jpg')
        sidecar=p.with_suffix('.json')
        sidecar.write_text(json.dumps({'title':'My tree','camera':'My phone','story':'A real story'}))
        photo=discover(self.root)['photos'][0]
        self.assertEqual(photo['title'],'My tree');self.assertEqual(photo['camera'],'My phone')
        sidecar.write_text('{broken');self.assertEqual(discover(self.root)['localCount'],1)
    def test_recent_folder_is_independent(self):
        self.photo('nature','tree.jpg');self.photo('recent','new.jpg')
        data=discover(self.root)
        self.assertEqual(len(data['photos']),1);self.assertEqual(len(data['recentPhotos']),1)
        self.assertEqual(data['recentPhotos'][0]['source'],'recent')
    def test_recent_defaults_to_new_category_photos(self):
        self.photo('landscapes','sky.jpg')
        self.assertEqual(discover(self.root)['recentPhotos'][0]['category'],'landscapes')
    def test_only_folder_photos_are_published(self):
        self.photo('life','wall.jpg')
        (self.root/'sample-photos.json').write_text(json.dumps([{'id':'sample','category':'life','sample':True}]))
        data=discover(self.root)
        self.assertEqual(len(data['photos']),1);self.assertFalse(data['photos'][0]['sample'])
    def test_markup_escaped_in_catalog_script(self):
        p=self.photo('life','wall.jpg');p.with_suffix('.json').write_text(json.dumps({'title':'</script>'}))
        build(self.root);self.assertNotIn('</script>',(self.root/'photos.js').read_text())
    def test_symlink_does_not_import_outside_photo(self):
        p=self.photo('nature','tree.jpg')
        (p.parent/'linked.jpg').symlink_to(p)
        self.assertEqual(discover(self.root)['localCount'],1)

if __name__=='__main__':unittest.main()
