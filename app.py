from flask import Flask, render_template, Response, request
from PIL import Image
from StringIO import StringIO
import math
import requests
import sys
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/blank')
def blank():
    return render_template('blank.html')

@app.route('/gallery')
def gallery():
    return render_template('gallery.html')

@app.route('/proxy')
def proxy():
    url = request.args.get('url')
    # dropbox URLs have ?dl=0 which brings you to a landing page
    # flip that to ?dl=1 to download the image itself
    if url.find('dropbox.com') != -1:
        url = url.replace('dl=0', 'dl=1')
    resize = request.args.get('resize')
    req = requests.get(url)
    content = req.content
    if resize:
        image = Image.open(StringIO(req.content))
        width, height = image.size
        next_power_of_two = math.floor(math.log(width, 2))
        new_width = 2 ** next_power_of_two
        ratio = 1.0 * new_width / width
        new_height = height * ratio
        image = image.resize((int(new_width), int(new_height)))
        imagefile = StringIO()
        image.save(imagefile, format='JPEG')
        content = imagefile.getvalue()
    return Response(content, content_type=req.headers['content-type'])

if __name__ == '__main__':
    debug = False
    if len(sys.argv) > 1 and sys.argv[1] == 'debug':
        debug = True
    extra_dirs = ['./',]
    extra_files = extra_dirs[:]
    for extra_dir in extra_dirs:
        for dirname, dirs, files in os.walk(extra_dir):
            for filename in files:
                filename = os.path.join(dirname, filename)
                if os.path.isfile(filename):
                    extra_files.append(filename)
    app.run(host='0.0.0.0', debug=debug, port=9090, extra_files=extra_files)
