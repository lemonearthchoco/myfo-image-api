import { S3Client, PutObjectCommand }  from '@aws-sdk/client-s3';
import busboy, { Busboy } from 'busboy';
import { v4 as uuidv4 } from 'uuid';

export async function imageUploadHandler(event: any) {
    const formData = await parseFormData(event);
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const key = `${process.env.APP_NAME}/${year}/${month}/${uuidv4()}_${formData.image[0].filename}`;
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: formData.image[1]
    });
    
    const s3Client = new S3Client({ region: process.env.REGION })
    await s3Client.send(command);

    return {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: "Image Upload Success!",
            imageUrl: encodeURI(`${process.env.BUCKET_LOCATION}/${key}`)
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