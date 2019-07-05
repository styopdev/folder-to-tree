var unzip = new JSZip();
var reader = new FileReader();
var fileNames;
var fileNamesTree;
var canvasHeight;
var imageStyles = {
    background: '#000000',
    foreground: '#00FA00',
    withDashes: true,
    withSizes: true,
    fontSize: 16,
    lineHeight: 22
};
var watermarkText = 'Generated by `foldertotree.cc`';

function openSelectFile() {
    document.getElementById('my-awesome-dropzone').click();
}

function retry() {
    document.getElementById('zone').style.display = 'inline-block';
    document.getElementById('tree-canvas').remove();
    document.getElementById('settings').style.display = 'none';
}

function generateFromGithub() {
    var githubUrl = 'https://cors-anywhere.herokuapp.com/'; 
    githubUrl += document.getElementById('github-url').value;
    githubUrl += '/archive/master.zip';
    // TODO add githubUrl validation;

    JSZipUtils.getBinaryContent(githubUrl, function(err, data) {
        if (err) {
            throw err; // or handle err
        }

        unzip
            .loadAsync(data)
            .then(function(data2) {
                processFile(data2);
            });
    });
}

function toTree(fileNameList, files) {
    var tree = [];

    fileNameList.forEach(file => {
        var isFolder = file.endsWith('/');  //Might be useful later
        var filePaths = file.split('/').filter(path => !!path);

        tree.push({
            path: filePaths[filePaths.length - 1],
            nestLevel: filePaths.length - 1,
            isFolder: isFolder,
            size: files[file]._data.uncompressedSize
        });
    });

    return tree;
}

function processFile(zip) {
    fileNames = Object.keys(zip.files);
    fileNamesTree = toTree(fileNames, zip.files);

    canvasHeight = fileNames.length * imageStyles.lineHeight + 50;
    var canvasElement = document.createElement('canvas');

    canvasElement.setAttribute('id', 'tree-canvas');
    document.getElementById('generated-tree').appendChild(canvasElement);
    document.getElementById('zone').style.display = 'none';

    var content = document.getElementById("content");
    content.classList.remove("flex");
    document.getElementById("settings").style.display = "block";

    drawTree();
}

function drawTree() {
    var canvas = document.getElementById('tree-canvas');
    canvas.width = 582;
    canvas.height = canvasHeight;

    var context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.webkitImageSmoothingEnabled = true;
    context.mozImageSmoothingEnabled = true;

    context.fillStyle = imageStyles.background;
    context.fillRect(0, 0, canvas.width, canvasHeight);

    fileNamesTree.forEach(function (file, index) {
        context.beginPath();
        context.fillStyle = imageStyles.foreground;
        context.font =  imageStyles.fontSize + "px Arial, Helvetica, sans-serif";

        var fileName = file.path;
        var leftShift = 25 + file.nestLevel * 25;
        var topShift = imageStyles.lineHeight * index + 30;

        if (imageStyles.withDashes) {
            fileName = `${'-'.repeat(4 * file.nestLevel)} ${file.path}`;
            leftShift = 30;
            topShift = imageStyles.lineHeight * index + 30;

            if (file.nestLevel === 0) {
                leftShift -= 5;
            }
        }

        if (file.isFolder) {
            fileName += ' /';
        }

        if (imageStyles.withSizes && file.size) {
            var fileSize = (file.size / 1000).toFixed(2);
            fileName += ` (~${ fileSize } kb)`;
        }

        context.fillText(fileName, leftShift, topShift);
    });

    context.font =  "12px Arial, Helvetica, sans-serif";
    context.fillText(watermarkText, canvas.width - 180, canvasHeight - 15);
}

function changeSetting(key, value) {
    imageStyles[key] = value;

    canvasHeight = fileNames.length * imageStyles.lineHeight + 50;
    var canvas = document.getElementById('tree-canvas');
    canvas.height = canvasHeight;

    drawTree();
}

function readFile(file) {
    reader.readAsBinaryString(file);

    reader.onload = function(file) {
        unzip
            .loadAsync(file.target.result)
            .then(function (zip) {
                processFile(zip);
            });
    };
}

Dropzone.options.myAwesomeDropzone = {
    paramName: "file",
    maxFiles: 1,
    maxFilesize: 2,
    accept: function(file, done) {
        if (file.name.endsWith(".zip")) {
            done();
            readFile(file);
            this.removeFile(file);
            return;
        } else {
            done("Only .zip files accepted.");
        }
    },
    init: function() {
        this.on("addedfile", function() {
            if (this.files[1] != null){
                this.removeFile(this.files[0]);
            }
        });
        this.on("error", function(file, message, xhr) {
            if (this.files[1] != null){
                this.removeFile(this.files[0]);
            }
        });
    }
};
