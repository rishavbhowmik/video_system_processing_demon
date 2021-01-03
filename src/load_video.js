const {DB, Keyspace} = require('./db')
const mongodb = require('mongodb')
const fs = require('fs/promises')
const mime_to_ext = require('./mime_to_ext')

/**
 * @param {string} _resolution - '144'|'360'|'720'
 * @type {function(_resolution)}
 * @returns {Promise<{
            _id: mongodb.ObjectId,
            title: string,
            upload_time: number,
            upload_id: mongodb.ObjectId,
            stream_manifest: {"144":null, "360":null, "720":null}
        }>}
 */
async function load_manifest(_resolution){
    try{
        const videos_collection = (await DB.mongodb_video_system()).collection('videos')
        var match_param = {}, update_param = {}
        match_param[`stream_manifest.${_resolution}`] = null
        update_param['$set'] = {}
        update_param['$set'][`stream_manifest.${_resolution}`] = { expire_at: Date.now()+60_000*60*2 }
        
        const result = await videos_collection.findOneAndUpdate(
            match_param,
            update_param
        )
        return result.value? {
            _id: result.value._id,
            title: result.value.title,
            upload_time: result.value.upload_time,
            upload_id: result.value.upload_id,
            stream_manifest: result.value.stream_manifest
        }:null

    }catch(e){
        throw e
    }
}

/**
 * @param {mongodb.ObjectId|string} video_upload_id - ObjectID of the video file
 * @type {function(video_upload_id)}
 * @returns {Promise<{
        _id: mongodb.ObjectId,
        user_id: string,
        name: string,
        size: number,
        mime_type: string,
        upload_size: number,
        upload_end: boolean,
        chunks: [
            {
                object_id: string,
                slice_start: number,
                size: number
            }
        ]
    }>}
 */
async function load_video_file_manifest(video_upload_id){
    try {
        const videos_collection = (await DB.mongodb_video_system()).collection('video_uploads')

        const result = await videos_collection.findOne(
            {_id:mongodb.ObjectId(video_upload_id)}
        )

        return result

    } catch (e) {
        throw e
    }
}

async function load_video_file(video_upload_id){
    const file_manifest = await load_video_file_manifest("5fdf0655034dc94dc44c4594")
    await fs.appendFile("temp/raw"+mime_to_ext(file_manifest.mime_type), Buffer.from(''))
    for(const i in file_manifest.chunks){
        const chunk = file_manifest.chunks[i]
        const result = await Keyspace.client().execute(
            Keyspace.COMMANDS.GET_PUBLIC_OBJECT,
            [chunk.object_id]
        )
        await fs.appendFile("temp/raw"+mime_to_ext(file_manifest.mime_type), result.rows[0].data)
        console.log(result.rows[0].data.length)
    }
}

async function load_video(){

}

module.exports = {load_video}

//unit tests
/*
load_manifest('144')
.then((res)=>{
    console.log(res);
})
.catch(err=>{
    console.log(err);
})
*/
/*
load_video_file_manifest("5fdf0655034dc94dc44c4594")
.then((res)=>{
    console.log(res);
})
.catch(err=>{
    console.log(err);
})
*/
/*
load_video_file("5fdf0655034dc94dc44c4594")
.then((res)=>{
    //console.log(res);
})
.catch(err=>{
    //console.log(err);
})
*/