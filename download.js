//download.js v4.0, by dandavis; 2008-2015. [CCBY2] fork by v1vendi
// https://github.com/v1vendi/download

(function (window, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);

    } else if (typeof exports === 'object') {
        module.exports = factory();

    } else {
        // Browser globals (root is window)
        window.download = factory();
    }
}(window, function () {

    return function download(data, fileName, mimeType) {

        var toString = function (a) { return String(a); },
			Blob = (window.Blob || window.MozBlob || window.WebKitBlob || toString);
        Blob = Blob.call ? Blob.bind(window) : Blob;

        fileName = fileName || "download";

        mimeType = mimeType || "application/octet-stream"; // this default mime also triggers iframe downloads

        if (String(this) === "true") { //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
            data = [data, mimeType];
            mimeType = data[0];
            data = data[1];
        }

        //download dataURLs right away
        if (String(data).match(/^data\:[\w+\-]+\/[\w+\-]+[,;]/)) {
            return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
				navigator.msSaveBlob(dataToBlob(data), fileName) :
				saver(data); // everyone else can save dataURLs un-processed
        }

        var blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });

        function dataToBlob(u) {
            var p = u.split(/[:;,]/),
			t = p[1],
			dec = p[2] == "base64" ? atob : decodeURIComponent,
			bin = dec(p.pop()),
			i = 0,
			uia = new Uint8Array(bin.length);

            for (i; i < bin.length; ++i) {
                uia[i] = bin.charCodeAt(i);
            }

            return new Blob([uia], { type: t });
        }

        function saver(url, winMode) {

            var a = document.createElement("a");

            if ('download' in a) { //html5 A[download]
                a.href = url;
                a.setAttribute("download", fileName);
                setTimeout(function () {
                    a.click();
                    if (winMode === true) {
                        setTimeout(function () {
                            window.URL.revokeObjectURL(a.href);
                        });
                    }
                });
                return true;
            }

            if (typeof safari !== "undefined") { // handle non-a[download] safari as best we can:
                url = "data:" + url.replace(/^data:([\w\/\-\+]+)/, u);
                if (!window.open(url)) { // popup blocked, offer direct download:
                    if (confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")) { location.href = url; }
                }
                return true;
            }

            //do iframe dataURL download (old ch+FF):
            var frame = document.createElement("iframe");
            document.body.appendChild(frame);

            if (!winMode) { // force a mime that will download:
                url = "data:" + url.replace(/^data:([\w\/\-\+]+)/, u);
            }
            frame.src = url;
            setTimeout(function () {
                document.body.removeChild(frame);
            });

            return true;
        }

        if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
            return navigator.msSaveBlob(blob, fileName);
        }

        if (window.URL) { // simple fast and modern way using Blob and URL:
            saver(window.URL.createObjectURL(blob), true);

        } else {
            // handle non-Blob()+non-URL browsers:
            if (typeof blob === "string" || blob.constructor === toString) {
                try {
                    return saver("data:" + mimeType + ";base64," + window.btoa(blob));
                } catch (y) {
                    return saver("data:" + mimeType + "," + encodeURIComponent(blob));
                }
            }

            // Blob but not URL:
            var fileReader = new FileReader();
            fileReader.onload = function () {
                saver(this.result);
            };
            fileReader.readAsDataURL(blob);
        }

        return true;
    };
}));