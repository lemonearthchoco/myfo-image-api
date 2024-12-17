import { S3 } from '@aws-sdk/client-s3';
import busboy, { Busboy } from 'busboy';

export async function imageUploadHandler(event: any) {
    const formData = await parseFormData(event);
    
    for (const file of formData.image) {
        console.log(file);
    }
    return {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: "Image Upload Success!",
            imageUrl: ""
          },
          null,
          2
        ),
      };
}

async function parseFormData(event: any): Promise<{ [key:string]: any[]}> {
    return new Promise((resolve, reject) => {
        const bodyBuffer = Buffer.from(event.body.toString(), "base64");
        const bb: Busboy = busboy({
            headers: event.headers
        });
        
        const formData = {};

        bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const chunks = [];

            file.on('data', data => { chunks.push(data) });
            file.on('end', () => {
                formData[fieldname] = [filename, Buffer.concat(chunks), mimetype];
            });
        });

        bb.on('error', err => { reject(err); })
        bb.on('finish', () => {
            resolve(formData);
        });

        bb.write(bodyBuffer, 'base64');
        bb.end();
    });
}