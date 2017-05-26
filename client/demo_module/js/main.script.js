// variables
(function () {
    "use strict";
    var outputElement = document.getElementById("output");
    var outputString;
    var props = {
        "leftchannel": [],
        "rightchannel": [],
        "recorder": null,
        "recording": null,
        "recordingLength": 0,
        "volume": null,
        "audioInput": null,
        "sampleRate": null,
        "audioContext": null,
        "context": null,
        "bufferSize": 2048,
        "timerCount": 0
    };

    var elements = {
        "startBtn": document.getElementById("start"),
        "stopBtn": document.getElementById("stop"),
        "sendTextBtn": document.getElementById("send-text"),
        "statusDisclaimer": document.getElementById("disclaimer"),
        "convertedDisclaimer": document.getElementById("converted"),
        "textDisclaimer": document.getElementById("text-disclaimer"),
        "textInput": document.getElementById("text-capture"),
        "downloadDummy": document.getElementById("download-dummy"),
        "canvas": document.getElementById("myCanvas")
    };

    var factory = {
        "sendAudio": function (formData) {
            return new Promise(function (resolve, reject) {
                elements.statusDisclaimer.classList.add("blink");
                elements.statusDisclaimer.innerHTML = "SENDING AUDIO";
                var xhr = new XMLHttpRequest();

                xhr.addEventListener("readystatechange", function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 || xhr.status === 201) {
                            elements.statusDisclaimer.classList.remove("blink");
                            elements.statusDisclaimer.innerHTML = "SENT SUCCESSFULLY";
                            var response;
                            try {
                                response = JSON.parse(xhr.responseText);
                            } catch (e) {
                                console.log(e);
                                response = xhr.responseText;
                            }
                            resolve(response);
                        } else {
                            elements.statusDisclaimer.classList.remove("blink");
                            elements.statusDisclaimer.innerHTML = "SENT WITH ERRORS - CHECK LOG";

                            var response;
                            try {
                                response = JSON.parse(xhr.responseText);
                            } catch (e) {
                                console.log(e);
                                response = xhr.responseText;
                            }

                            reject(response);
                        }

                    }
                });

                xhr.open("POST", "/convertAudioToText");
                xhr.send(formData);
            });
        },
        "sendText": function (textInput) {
            return new Promise(function (resolve, reject) {

                if (!textInput) {
                    return reject("invalid input");
                }

                elements.textDisclaimer.classList.add("blink");
                elements.textDisclaimer.innerHTML = "SENDING TEXT";
                var xhr = new XMLHttpRequest();

                xhr.addEventListener("readystatechange", function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 || xhr.status === 201) {
                            try {
                                resolve(JSON.parse(xhr.responseText));
                            } catch (e) {
                                resolve(xhr.responseText);
                            }
                            elements.textDisclaimer.classList.remove("blink");
                            elements.textDisclaimer.innerHTML = "SENT SUCCESSFULLY";

                        } else {
                            elements.textDisclaimer.classList.remove("blink");
                            elements.textDisclaimer.innerHTML = "SENT WITH ERRORS - CHECK LOG";
                            console.log(xhr);
                            reject(xhr.responseText);
                        }

                    }
                });

                xhr.open("POST", "/convertTextToAudio");
                xhr.setRequestHeader("content-type", "application/json");

                xhr.send(JSON.stringify({
                    "textMessage": textInput
                }));
            });
        }
    };

    var methods = {
        "draw": function () {
            if (props.recording || props.watsonSpeaking) {
                props.analyser.getByteTimeDomainData(props.dataArray);
                props.canvasCtx.fillStyle = "rgb(200, 200, 200)";
                props.canvasCtx.fillRect(0, 0, 500, 200);
                props.canvasCtx.lineWidth = 2;

                if (props.recording) {
                    props.canvasCtx.strokeStyle = "rgb(88, 30, 172)";
                } else if (props.watsonSpeaking) {
                    props.canvasCtx.strokeStyle = "rgb(30, 172, 88)";
                }

                props.canvasCtx.beginPath();
                var sliceWidth = 1010 / props.bufferSize;
                var x = 0;

                for (var i = 0; i < props.bufferSize; i += 1) {

                    var v = props.dataArray[i] / 128.0;
                    var y = v * 200/2;

                    if (i === 0) {
                        props.canvasCtx.moveTo(x, y);
                    } else {
                        props.canvasCtx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                props.canvasCtx.lineTo(elements.canvas.width, elements.canvas.height / 2);
                props.canvasCtx.stroke();
            } else {
                props.canvasCtx.clearRect(0, 0, 500, 200);
            }
            requestAnimationFrame(methods.draw);
        },
        "startTimer": function () {

        },
        "timerTrack": function () {

        },
        "clearTimer": function () {

        },
        "startUserMedia": function (e) {
            // creates the audio props.context
            props.audioContext = window.AudioContext || window.webkitAudioContext;

            props.context = new props.audioContext();
            props.analyser = props.context.createAnalyser();
            // we query the props.context sample rate (varies depending on platforms)
            props.sampleRate = props.context.sampleRate;

            console.log("succcess lifting up the media capture");
            elements.statusDisclaimer.innerHTML = "INITIALIZED";

            // creates a gain node
            props.volume = props.context.createGain();

            // creates an audio node from the microphone incoming stream
            props.audioInput = props.context.createMediaStreamSource(e);
            props.audioInput.connect(props.analyser);

            // connect the stream to the gain node
            props.audioInput.connect(props.volume);

            /* From the spec: This value controls how frequently the audioprocess event is
             dispatched and how many sample-frames need to be processed each call.
             Lower values for buffer size will result in a lower (better) latency.
             Higher values will be necessary to avoid audio breakup and glitches */
            props.recorder = props.context.createScriptProcessor(props.bufferSize, 2, 2);

            props.analyser.fftSize = 2048;
            var bufferLength = props.analyser.frequencyBinCount;
            props.dataArray = new Uint8Array(bufferLength);
            props.canvasCtx = elements.canvas.getContext("2d");
            requestAnimationFrame(methods.draw);

            props.recorder.onaudioprocess = function(e) {
                if (!props.recording) {
                    return;
                }
                props.analyser.getByteTimeDomainData(props.dataArray);
                
                var left = e.inputBuffer.getChannelData(0);
                var right = e.inputBuffer.getChannelData(1);
                // we clone the samples
                props.leftchannel.push (new Float32Array (left));
                props.rightchannel.push (new Float32Array (right));
                props.recordingLength += props.bufferSize;
                console.log("recording");
            };

            // we connect the props.recorder
            props.volume.connect(props.recorder);
            props.recorder.connect(props.context.destination);
        },
        "toggleRecording": function () {
            if (this.classList.contains("playing")) {
                this.classList.remove("playing");
                this.classList.add("stopped");
                methods.stopRecording();
            } else {
                this.classList.remove("stopped");
                this.classList.add("playing");
                methods.startRecording();
            }
        },
        "startRecording": function () {
            elements.statusDisclaimer.classList.add("blink");
            elements.statusDisclaimer.innerHTML = "RECORDING";
            props.recording = true;
            methods.startTimer();
            props.leftchannel.length = props.rightchannel.length = 0;
            props.recordingLength = 0;
        },
        "sendText": function () {
            factory.sendText(elements.textInput.value).then(function (data) {
                console.log(data);
                methods.downloadConvertedFile(data.fileName, data.filePath);
            }, function (error) {
                console.log(error);
            })
        },
        "downloadConvertedFile": function (fileName, filePath) {
            elements.downloadDummy.href = ["/downloadAudio?fileName=", fileName, "&filePath=", filePath].join("");
            elements.downloadDummy.style.display = "none";
            elements.downloadDummy.click();
            console.log(filePath);
        },
        "stopRecording": function () {
            elements.statusDisclaimer.classList.remove("blink");
            elements.statusDisclaimer.innerHTML = "STOPPED";
            // we stop props.recording
            props.recording = false;
            // outputElement.innerHTML = "Building wav file...";

            // we flat the left and right channels down
            var leftBuffer = methods.mergeBuffers (props.leftchannel, props.recordingLength);
            var rightBuffer = methods.mergeBuffers (props.rightchannel, props.recordingLength);
            // we interleave both channels together
            var interleaved = methods.interleave (leftBuffer, rightBuffer);

            // we create our wav file
            var buffer = new ArrayBuffer(44 + interleaved.length * 2);
            var view = new DataView(buffer);

            // RIFF chunk descriptor
            methods.writeUTFBytes(view, 0, "RIFF");
            view.setUint32(4, 44 + interleaved.length * 2, true);
            methods.writeUTFBytes(view, 8, "WAVE");
            // FMT sub-chunk
            methods.writeUTFBytes(view, 12, "fmt ");
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            // stereo (2 channels)
            view.setUint16(22, 2, true);
            view.setUint32(24, props.sampleRate, true);
            view.setUint32(28, props.sampleRate * 4, true);
            view.setUint16(32, 4, true);
            view.setUint16(34, 16, true);
            // data sub-chunk
            methods.writeUTFBytes(view, 36, "data");
            view.setUint32(40, interleaved.length * 2, true);

            // write the PCM samples
            var lng = interleaved.length;
            var index = 44;
            props.volume = 1;
            for (var i = 0; i < lng; i += 1) {
                view.setInt16(index, interleaved[i] * (0x7FFF * props.volume), true);
                index += 2;
            }

            // our final binary blob
            var blob = new Blob ([view], { "type" : "audio/wav" });
            var data = new FormData();
            data.append("audio", blob);
            console.log("about to send audio");
            factory.sendAudio(data).then(function successCB (response) {
                console.log("SUCCESS SENDING AUDIO");
                console.log(response);
                var audioEl = document.querySelector("#audio");
                var sourceEl = document.querySelector("#audio > source");

                sourceEl.setAttribute("src", ["/downloadAudio?fileName=", response.tts.fileName, "&filePath=", response.tts.filePath].join(""));
                audioEl.load();

                audioEl.onplay = function () {
                    props.watsonSpeaking = true;
                };
                audioEl.onended = function () {
                    props.watsonSpeaking = false;
                };
                audio.play();

            }, function errorCB (error) {
                console.log("ERROR SENDING AUDIO");
                console.log(error);
            });
        },
        "interleave": function (leftchannel, rightchannel) {
            var length = leftchannel.length + rightchannel.length;
            var result = new Float32Array(length);

            var inputIndex = 0;

            for (var index = 0; index < length; ){
                result[index += 1] = leftchannel[inputIndex];
                result[index += 1] = rightchannel[inputIndex];
                inputIndex += 1;
            }
            return result;
        },
        "mergeBuffers": function (channelBuffer, recordingLength) {
            var result = new Float32Array(recordingLength);
            var offset = 0;
            var lng = channelBuffer.length;
            for (var i = 0; i < lng; i++){
                var buffer = channelBuffer[i];
                result.set(buffer, offset);
                offset += buffer.length;
            }
            return result;
        },
        "writeUTFBytes": function (view, offset, string) {
            var lng = string.length;
            for (var i = 0; i < lng; i += 1){
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        },
        "init": function () {
            if (!navigator.getUserMedia) {
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia || navigator.msGetUserMedia;
            }

            if (navigator.getUserMedia) {
                navigator.getUserMedia({
                    "audio": true
                }, methods.startUserMedia, function(e) {
                    alert("Error capturing audio.");
                });

                elements.startBtn.addEventListener("click", methods.toggleRecording);
                // elements.sendTextBtn.addEventListener("click", methods.sendText);
            } else {
                alert("getUserMedia not supported in this browser.");
            }
        }
    };

    window.onload = methods.init;

}());
