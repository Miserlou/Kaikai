from flask import Flask, render_template
import sys
import os

app = Flask(__name__)

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/blank")
def blank():
    return render_template('blank.html')

@app.route("/gallery")
def gallery():
    return render_template('gallery.html')

if __name__ == "__main__":
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
