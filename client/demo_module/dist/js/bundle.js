(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// variables
(function () {
    "use strict";
    var leftchannel = [];
    var rightchannel = [];
    var recorder = null;
    var recording = false;
    var recordingLength = 0;
    var volume = null;
    var audioInput = null;
    var sampleRate = null;
    var audioContext = null;
    var context = null;
    var outputElement = document.getElementById('output');
    var outputString;

// feature detection
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getUserMedia){
        navigator.getUserMedia({audio:true}, success, function(e) {
            alert('Error capturing audio.');
        });
    } else alert('getUserMedia not supported in this browser.');

// when key is down
    window.onkeydown = function(e){

        // if R is pressed, we start recording
        if ( e.keyCode == 82 ){
            recording = true;
            // reset the buffers for the new recording
            leftchannel.length = rightchannel.length = 0;
            recordingLength = 0;
            // outputElement.innerHTML = 'Recording now...';
            // if S is pressed, we stop the recording and package the WAV file
        } else if ( e.keyCode == 83 ){

            // we stop recording
            recording = false;

            // outputElement.innerHTML = 'Building wav file...';

            // we flat the left and right channels down
            var leftBuffer = mergeBuffers ( leftchannel, recordingLength );
            var rightBuffer = mergeBuffers ( rightchannel, recordingLength );
            // we interleave both channels together
            var interleaved = interleave ( leftBuffer, rightBuffer );

            // we create our wav file
            var buffer = new ArrayBuffer(44 + interleaved.length * 2);
            var view = new DataView(buffer);

            // RIFF chunk descriptor
            writeUTFBytes(view, 0, 'RIFF');
            view.setUint32(4, 44 + interleaved.length * 2, true);
            writeUTFBytes(view, 8, 'WAVE');
            // FMT sub-chunk
            writeUTFBytes(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            // stereo (2 channels)
            view.setUint16(22, 2, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 4, true);
            view.setUint16(32, 4, true);
            view.setUint16(34, 16, true);
            // data sub-chunk
            writeUTFBytes(view, 36, 'data');
            view.setUint32(40, interleaved.length * 2, true);

            // write the PCM samples
            var lng = interleaved.length;
            var index = 44;
            var volume = 1;
            for (var i = 0; i < lng; i++){
                view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
                index += 2;
            }

            // our final binary blob
            var blob = new Blob ( [ view ], { type : 'audio/wav' } );
            console.log(blob);

            // let's save it locally
            // outputElement.innerHTML = 'Handing off the file now...';
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            var link = window.document.createElement('a');
            link.href = url;
            link.download = 'output.wav';
            var click = document.createEvent("Event");
            click.initEvent("click", true, true);
            link.dispatchEvent(click);


            var data = new FormData();
            data.append("audio", blob);
            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true;

            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4) {
                    console.log(this.responseText);
                }
            });

            xhr.open("POST", "http://localhost:6038/test");
            xhr.setRequestHeader("cache-control", "no-cache");
            xhr.setRequestHeader("postman-token", "b56b0689-c203-2edc-b374-9219299802d4");

            xhr.send(data);

        }
    }

    function interleave(leftChannel, rightChannel){
        var length = leftChannel.length + rightChannel.length;
        var result = new Float32Array(length);

        var inputIndex = 0;

        for (var index = 0; index < length; ){
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }
        return result;
    }

    function mergeBuffers(channelBuffer, recordingLength){
        var result = new Float32Array(recordingLength);
        var offset = 0;
        var lng = channelBuffer.length;
        for (var i = 0; i < lng; i++){
            var buffer = channelBuffer[i];
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    }

    function writeUTFBytes(view, offset, string){
        var lng = string.length;
        for (var i = 0; i < lng; i++){
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function success(e){
        // creates the audio context
        audioContext = window.AudioContext || window.webkitAudioContext;
        context = new audioContext();

        // we query the context sample rate (varies depending on platforms)
        sampleRate = context.sampleRate;

        console.log('succcess');

        // creates a gain node
        volume = context.createGain();

        // creates an audio node from the microphone incoming stream
        audioInput = context.createMediaStreamSource(e);

        // connect the stream to the gain node
        audioInput.connect(volume);

        /* From the spec: This value controls how frequently the audioprocess event is
         dispatched and how many sample-frames need to be processed each call.
         Lower values for buffer size will result in a lower (better) latency.
         Higher values will be necessary to avoid audio breakup and glitches */
        var bufferSize = 2048;
        recorder = context.createScriptProcessor(bufferSize, 2, 2);

        recorder.onaudioprocess = function(e){
            if (!recording) return;
            var left = e.inputBuffer.getChannelData (0);
            var right = e.inputBuffer.getChannelData (1);
            // we clone the samples
            leftchannel.push (new Float32Array (left));
            rightchannel.push (new Float32Array (right));
            recordingLength += bufferSize;
            console.log('recording');
        }

        // we connect the recorder
        volume.connect (recorder);
        recorder.connect (context.destination);
    }

}());

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5pZWxhYnJhby9EZXNrdG9wL2xhaXMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9kYW5pZWxhYnJhby9EZXNrdG9wL2xhaXMvY2xpZW50L2pzL21haW4uc2NyaXB0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyB2YXJpYWJsZXNcbihmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGxlZnRjaGFubmVsID0gW107XG4gICAgdmFyIHJpZ2h0Y2hhbm5lbCA9IFtdO1xuICAgIHZhciByZWNvcmRlciA9IG51bGw7XG4gICAgdmFyIHJlY29yZGluZyA9IGZhbHNlO1xuICAgIHZhciByZWNvcmRpbmdMZW5ndGggPSAwO1xuICAgIHZhciB2b2x1bWUgPSBudWxsO1xuICAgIHZhciBhdWRpb0lucHV0ID0gbnVsbDtcbiAgICB2YXIgc2FtcGxlUmF0ZSA9IG51bGw7XG4gICAgdmFyIGF1ZGlvQ29udGV4dCA9IG51bGw7XG4gICAgdmFyIGNvbnRleHQgPSBudWxsO1xuICAgIHZhciBvdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ291dHB1dCcpO1xuICAgIHZhciBvdXRwdXRTdHJpbmc7XG5cbi8vIGZlYXR1cmUgZGV0ZWN0aW9uXG4gICAgaWYgKCFuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKVxuICAgICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8XG4gICAgICAgICAgICBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYTtcblxuICAgIGlmIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKXtcbiAgICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86dHJ1ZX0sIHN1Y2Nlc3MsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdFcnJvciBjYXB0dXJpbmcgYXVkaW8uJyk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBhbGVydCgnZ2V0VXNlck1lZGlhIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyLicpO1xuXG4vLyB3aGVuIGtleSBpcyBkb3duXG4gICAgd2luZG93Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGUpe1xuXG4gICAgICAgIC8vIGlmIFIgaXMgcHJlc3NlZCwgd2Ugc3RhcnQgcmVjb3JkaW5nXG4gICAgICAgIGlmICggZS5rZXlDb2RlID09IDgyICl7XG4gICAgICAgICAgICByZWNvcmRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgLy8gcmVzZXQgdGhlIGJ1ZmZlcnMgZm9yIHRoZSBuZXcgcmVjb3JkaW5nXG4gICAgICAgICAgICBsZWZ0Y2hhbm5lbC5sZW5ndGggPSByaWdodGNoYW5uZWwubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHJlY29yZGluZ0xlbmd0aCA9IDA7XG4gICAgICAgICAgICAvLyBvdXRwdXRFbGVtZW50LmlubmVySFRNTCA9ICdSZWNvcmRpbmcgbm93Li4uJztcbiAgICAgICAgICAgIC8vIGlmIFMgaXMgcHJlc3NlZCwgd2Ugc3RvcCB0aGUgcmVjb3JkaW5nIGFuZCBwYWNrYWdlIHRoZSBXQVYgZmlsZVxuICAgICAgICB9IGVsc2UgaWYgKCBlLmtleUNvZGUgPT0gODMgKXtcblxuICAgICAgICAgICAgLy8gd2Ugc3RvcCByZWNvcmRpbmdcbiAgICAgICAgICAgIHJlY29yZGluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBvdXRwdXRFbGVtZW50LmlubmVySFRNTCA9ICdCdWlsZGluZyB3YXYgZmlsZS4uLic7XG5cbiAgICAgICAgICAgIC8vIHdlIGZsYXQgdGhlIGxlZnQgYW5kIHJpZ2h0IGNoYW5uZWxzIGRvd25cbiAgICAgICAgICAgIHZhciBsZWZ0QnVmZmVyID0gbWVyZ2VCdWZmZXJzICggbGVmdGNoYW5uZWwsIHJlY29yZGluZ0xlbmd0aCApO1xuICAgICAgICAgICAgdmFyIHJpZ2h0QnVmZmVyID0gbWVyZ2VCdWZmZXJzICggcmlnaHRjaGFubmVsLCByZWNvcmRpbmdMZW5ndGggKTtcbiAgICAgICAgICAgIC8vIHdlIGludGVybGVhdmUgYm90aCBjaGFubmVscyB0b2dldGhlclxuICAgICAgICAgICAgdmFyIGludGVybGVhdmVkID0gaW50ZXJsZWF2ZSAoIGxlZnRCdWZmZXIsIHJpZ2h0QnVmZmVyICk7XG5cbiAgICAgICAgICAgIC8vIHdlIGNyZWF0ZSBvdXIgd2F2IGZpbGVcbiAgICAgICAgICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQgKyBpbnRlcmxlYXZlZC5sZW5ndGggKiAyKTtcbiAgICAgICAgICAgIHZhciB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG5cbiAgICAgICAgICAgIC8vIFJJRkYgY2h1bmsgZGVzY3JpcHRvclxuICAgICAgICAgICAgd3JpdGVVVEZCeXRlcyh2aWV3LCAwLCAnUklGRicpO1xuICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoNCwgNDQgKyBpbnRlcmxlYXZlZC5sZW5ndGggKiAyLCB0cnVlKTtcbiAgICAgICAgICAgIHdyaXRlVVRGQnl0ZXModmlldywgOCwgJ1dBVkUnKTtcbiAgICAgICAgICAgIC8vIEZNVCBzdWItY2h1bmtcbiAgICAgICAgICAgIHdyaXRlVVRGQnl0ZXModmlldywgMTIsICdmbXQgJyk7XG4gICAgICAgICAgICB2aWV3LnNldFVpbnQzMigxNiwgMTYsIHRydWUpO1xuICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMjAsIDEsIHRydWUpO1xuICAgICAgICAgICAgLy8gc3RlcmVvICgyIGNoYW5uZWxzKVxuICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMjIsIDIsIHRydWUpO1xuICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMjQsIHNhbXBsZVJhdGUsIHRydWUpO1xuICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMjgsIHNhbXBsZVJhdGUgKiA0LCB0cnVlKTtcbiAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KDMyLCA0LCB0cnVlKTtcbiAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KDM0LCAxNiwgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBkYXRhIHN1Yi1jaHVua1xuICAgICAgICAgICAgd3JpdGVVVEZCeXRlcyh2aWV3LCAzNiwgJ2RhdGEnKTtcbiAgICAgICAgICAgIHZpZXcuc2V0VWludDMyKDQwLCBpbnRlcmxlYXZlZC5sZW5ndGggKiAyLCB0cnVlKTtcblxuICAgICAgICAgICAgLy8gd3JpdGUgdGhlIFBDTSBzYW1wbGVzXG4gICAgICAgICAgICB2YXIgbG5nID0gaW50ZXJsZWF2ZWQubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gNDQ7XG4gICAgICAgICAgICB2YXIgdm9sdW1lID0gMTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG5nOyBpKyspe1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0SW50MTYoaW5kZXgsIGludGVybGVhdmVkW2ldICogKDB4N0ZGRiAqIHZvbHVtZSksIHRydWUpO1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG91ciBmaW5hbCBiaW5hcnkgYmxvYlxuICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYiAoIFsgdmlldyBdLCB7IHR5cGUgOiAnYXVkaW8vd2F2JyB9ICk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhibG9iKTtcblxuICAgICAgICAgICAgLy8gbGV0J3Mgc2F2ZSBpdCBsb2NhbGx5XG4gICAgICAgICAgICAvLyBvdXRwdXRFbGVtZW50LmlubmVySFRNTCA9ICdIYW5kaW5nIG9mZiB0aGUgZmlsZSBub3cuLi4nO1xuICAgICAgICAgICAgdmFyIHVybCA9ICh3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwpLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgICAgIHZhciBsaW5rID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGxpbmsuaHJlZiA9IHVybDtcbiAgICAgICAgICAgIGxpbmsuZG93bmxvYWQgPSAnb3V0cHV0Lndhdic7XG4gICAgICAgICAgICB2YXIgY2xpY2sgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICAgICAgICAgICAgY2xpY2suaW5pdEV2ZW50KFwiY2xpY2tcIiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICBsaW5rLmRpc3BhdGNoRXZlbnQoY2xpY2spO1xuXG5cbiAgICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICBkYXRhLmFwcGVuZChcImF1ZGlvXCIsIGJsb2IpO1xuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG5cbiAgICAgICAgICAgIHhoci5hZGRFdmVudExpc3RlbmVyKFwicmVhZHlzdGF0ZWNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHhoci5vcGVuKFwiUE9TVFwiLCBcImh0dHA6Ly9sb2NhbGhvc3Q6NjAzOC90ZXN0XCIpO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJjYWNoZS1jb250cm9sXCIsIFwibm8tY2FjaGVcIik7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcInBvc3RtYW4tdG9rZW5cIiwgXCJiNTZiMDY4OS1jMjAzLTJlZGMtYjM3NC05MjE5Mjk5ODAyZDRcIik7XG5cbiAgICAgICAgICAgIHhoci5zZW5kKGRhdGEpO1xuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnRlcmxlYXZlKGxlZnRDaGFubmVsLCByaWdodENoYW5uZWwpe1xuICAgICAgICB2YXIgbGVuZ3RoID0gbGVmdENoYW5uZWwubGVuZ3RoICsgcmlnaHRDaGFubmVsLmxlbmd0aDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkobGVuZ3RoKTtcblxuICAgICAgICB2YXIgaW5wdXRJbmRleCA9IDA7XG5cbiAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgKXtcbiAgICAgICAgICAgIHJlc3VsdFtpbmRleCsrXSA9IGxlZnRDaGFubmVsW2lucHV0SW5kZXhdO1xuICAgICAgICAgICAgcmVzdWx0W2luZGV4KytdID0gcmlnaHRDaGFubmVsW2lucHV0SW5kZXhdO1xuICAgICAgICAgICAgaW5wdXRJbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVyZ2VCdWZmZXJzKGNoYW5uZWxCdWZmZXIsIHJlY29yZGluZ0xlbmd0aCl7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KHJlY29yZGluZ0xlbmd0aCk7XG4gICAgICAgIHZhciBvZmZzZXQgPSAwO1xuICAgICAgICB2YXIgbG5nID0gY2hhbm5lbEJ1ZmZlci5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG5nOyBpKyspe1xuICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IGNoYW5uZWxCdWZmZXJbaV07XG4gICAgICAgICAgICByZXN1bHQuc2V0KGJ1ZmZlciwgb2Zmc2V0KTtcbiAgICAgICAgICAgIG9mZnNldCArPSBidWZmZXIubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd3JpdGVVVEZCeXRlcyh2aWV3LCBvZmZzZXQsIHN0cmluZyl7XG4gICAgICAgIHZhciBsbmcgPSBzdHJpbmcubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxuZzsgaSsrKXtcbiAgICAgICAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0ICsgaSwgc3RyaW5nLmNoYXJDb2RlQXQoaSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhlKXtcbiAgICAgICAgLy8gY3JlYXRlcyB0aGUgYXVkaW8gY29udGV4dFxuICAgICAgICBhdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG4gICAgICAgIGNvbnRleHQgPSBuZXcgYXVkaW9Db250ZXh0KCk7XG5cbiAgICAgICAgLy8gd2UgcXVlcnkgdGhlIGNvbnRleHQgc2FtcGxlIHJhdGUgKHZhcmllcyBkZXBlbmRpbmcgb24gcGxhdGZvcm1zKVxuICAgICAgICBzYW1wbGVSYXRlID0gY29udGV4dC5zYW1wbGVSYXRlO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCdzdWNjY2VzcycpO1xuXG4gICAgICAgIC8vIGNyZWF0ZXMgYSBnYWluIG5vZGVcbiAgICAgICAgdm9sdW1lID0gY29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgLy8gY3JlYXRlcyBhbiBhdWRpbyBub2RlIGZyb20gdGhlIG1pY3JvcGhvbmUgaW5jb21pbmcgc3RyZWFtXG4gICAgICAgIGF1ZGlvSW5wdXQgPSBjb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKGUpO1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdGhlIHN0cmVhbSB0byB0aGUgZ2FpbiBub2RlXG4gICAgICAgIGF1ZGlvSW5wdXQuY29ubmVjdCh2b2x1bWUpO1xuXG4gICAgICAgIC8qIEZyb20gdGhlIHNwZWM6IFRoaXMgdmFsdWUgY29udHJvbHMgaG93IGZyZXF1ZW50bHkgdGhlIGF1ZGlvcHJvY2VzcyBldmVudCBpc1xuICAgICAgICAgZGlzcGF0Y2hlZCBhbmQgaG93IG1hbnkgc2FtcGxlLWZyYW1lcyBuZWVkIHRvIGJlIHByb2Nlc3NlZCBlYWNoIGNhbGwuXG4gICAgICAgICBMb3dlciB2YWx1ZXMgZm9yIGJ1ZmZlciBzaXplIHdpbGwgcmVzdWx0IGluIGEgbG93ZXIgKGJldHRlcikgbGF0ZW5jeS5cbiAgICAgICAgIEhpZ2hlciB2YWx1ZXMgd2lsbCBiZSBuZWNlc3NhcnkgdG8gYXZvaWQgYXVkaW8gYnJlYWt1cCBhbmQgZ2xpdGNoZXMgKi9cbiAgICAgICAgdmFyIGJ1ZmZlclNpemUgPSAyMDQ4O1xuICAgICAgICByZWNvcmRlciA9IGNvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yKGJ1ZmZlclNpemUsIDIsIDIpO1xuXG4gICAgICAgIHJlY29yZGVyLm9uYXVkaW9wcm9jZXNzID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICBpZiAoIXJlY29yZGluZykgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIGxlZnQgPSBlLmlucHV0QnVmZmVyLmdldENoYW5uZWxEYXRhICgwKTtcbiAgICAgICAgICAgIHZhciByaWdodCA9IGUuaW5wdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEgKDEpO1xuICAgICAgICAgICAgLy8gd2UgY2xvbmUgdGhlIHNhbXBsZXNcbiAgICAgICAgICAgIGxlZnRjaGFubmVsLnB1c2ggKG5ldyBGbG9hdDMyQXJyYXkgKGxlZnQpKTtcbiAgICAgICAgICAgIHJpZ2h0Y2hhbm5lbC5wdXNoIChuZXcgRmxvYXQzMkFycmF5IChyaWdodCkpO1xuICAgICAgICAgICAgcmVjb3JkaW5nTGVuZ3RoICs9IGJ1ZmZlclNpemU7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVjb3JkaW5nJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB3ZSBjb25uZWN0IHRoZSByZWNvcmRlclxuICAgICAgICB2b2x1bWUuY29ubmVjdCAocmVjb3JkZXIpO1xuICAgICAgICByZWNvcmRlci5jb25uZWN0IChjb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICB9XG5cbn0oKSk7XG4iXX0=
