const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  // Log the event argument for debugging and for use in local development.
  console.log(JSON.stringify(event, undefined, 2));

  const BucketName = event.Records[0].s3.bucket.name;
  const ObjectKey = event.Records[0].s3.object.key;
  const TableName = process.env.TABLE_NAME;
  const CollectionName = process.env.COLLECTION_NAME;

  let response;
  let statusCode;

  try {
    // Adding an image to the collection
    if (event.Records[0].eventName === 'ObjectCreated:Put') {
      console.log(`Adding image to ${CollectionName} collection`);
      // TODO add call to rekognition indexFaces here and grab FaceId from reply
      const FaceId = '8675309';
      console.log(`Face successfully added to ${CollectionName} collection`);

      console.log(`Adding metadata to ${TableName}`);
      await dynamodb.put({
        TableName,
        Item: {
          FaceId,
          BucketName,
          ObjectKey
        }
      }).promise();
      console.log(`Image metadata successfully written to dynamoDB`);

      response = `Image successfully added to the ${CollectionName} collection`;
    }

    // Removing an image from the collection
    if (event.Records[0].eventName === 'ObjectRemoved:Delete') {
      console.log('Getting FaceId from dynamoDB');
      const { Item } = await dynamodb.get({
        TableName,
        Key: { ObjectKey }
      }).promise();
      console.log('FaceId successfully obtained from dynamoDB');

      console.log(`Deteting face from the ${CollectionName} collection`);
      // TODO add deleteFaces call to rekognition here
      console.log(`FacedId is ${Item.FaceId}`);
      console.log(`Face successfully deleted from the ${CollectionName} collection`);

      console.log('Removing image metadata from dynamoDB');
      await dynamodb.delete({
        TableName,
        Key: { ObjectKey }
      }).promise();
      console.log('Image metadata successfully removed from dynamoDB');

      response = `Image successfully removed from the ${CollectionName} collection`;
    }

    statusCode = 200;
  } catch (err) {
    console.log('An error occured ', JSON.stringify(err, undefined, 2));
    response = err.message;
    statusCode = err.statusCode || 500;
  }

  return {
    headers: {},
    statusCode,
    body: JSON.stringify(response)
  };
};
