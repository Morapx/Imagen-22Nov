import { promises } from "dns";
import { start } from "repl";

const imageUpload = document.getElementById('imageUpload');

promises.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start(){
    const container = document.createElement('div')
    container.style.position = 'relative'
    document.body.append(container)
    const labeldFaceDecriptors = await loadLabelImages()
    const faceMatcher = faceapi.FaceMatcher(labeledFaceDecriptors, 0.6)
    let image
    let canvas
    document.body.append('Loaded')

    imageUpload.addEventListener('change', async () => {
        if (image) image.remove()
        if (canvas) canvas.remove()

        image = await faceapi.bufferToImage(imageUpload.file[0])
        container.append(image)
        canvas = faceapi.createCanvasFromMedia(image)
        container.append(canvas)

        const displaySize = {width: image.width, height: image.height}
        faceapi.matchDimensions(canvas, displaySize)

        const detection = await faceapi.detectAllFaces(image).withFaceLandMarks().withFaceDescriptors()
        const resizeDetections = faceapi.resizeResults(detection, displaySize)
        const result = resizeDetections.map(d => faceMatcher.findBestMatch(d.descriptor))

        result.forEach((result, i) =>{
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, {label: results.toString()})
            drawBox.draw(canvas)
        })

    })
}

function loadLabelImages() {
    const labels = ['Black widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'jime Rhodes', 'Thor', 'Tony Stark']
    return Promise.all(
        label.map(async label => {
            const descriptions = []
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`https://mawe.mx/face/images/${label}/${i}.jpg`)
                const detections = await faceapi.detectionSingleFace(img).withFaceLandMarks().withFaceDescriptors()
                descriptions.push(detections.descriptor)
            }

        return new faceapi.LabeledFaceDecriptors(label, descriptions)
        })
    )
}
