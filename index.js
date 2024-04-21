const tf = require("@tensorflow/tfjs-node");
const faceapi = require("face-api.js");
require("@tensorflow/tfjs-node");
const fs = require("fs");
const { exec } = require("child_process");
const bluebird = require("bluebird");
const { setTimeout } = require("node:timers/promises");
const axios = require("axios");

const timeInterval = 10 * 1000;
const invokeUrl = process.env.INVOKE_API;
const personLabel = process.env.PERSON_NAME || "person1";

if (!invokeUrl) {
    throw new Error("No url to invoke");
}

faceapi.nets.faceRecognitionNet.loadFromDisk('models')
    .then(() => faceapi.nets.ssdMobilenetv1.loadFromDisk('models'))
    .then(() => faceapi.nets.faceLandmark68Net.loadFromDisk('models'))
    .then(async () => {
        const descriptors = [];
        for (let i = 1; i < 4; i += 1) {
            const image = fs.readFileSync(`training_images/image${i}.jpg`)
            const queryImage1 = tf.node.decodeImage(image);
            descriptors.push(
                (await faceapi
                    .detectSingleFace(queryImage1)
                    .withFaceLandmarks()
                    .withFaceDescriptor()).descriptor
            );
        }

        return [
            new faceapi.LabeledFaceDescriptors(personLabel, descriptors)
        ]
    })
    .then(descriptors => new faceapi.FaceMatcher(descriptors))
    .then(async faceMatcher => {
        while (true) {
            await setTimeout(timeInterval);
            const fileName = `captured-${Date.now()}.jpg`;

            await bluebird.fromCallback(done => {
                exec(`python3 camera_capture.py -filename ${fileName}`, done);
            })
            .then(output => {
                console.log(output)
                const image = fs.readFileSync(fileName);
                const queryImage = tf.node.decodeImage(image);
                return faceapi
                    .detectSingleFace(queryImage)
                    .withFaceLandmarks()
                    .withFaceDescriptor()
            })
            .then(incomingFace => {
                const bestMatch = faceMatcher.findBestMatch(incomingFace.descriptor)
                if (bestMatch?._label !== personLabel) {
                    console.log("NOT YOU! INTRUDER!!!!!");
                    return axios.post(invokeUrl, {});
                }
            });
        }
    });