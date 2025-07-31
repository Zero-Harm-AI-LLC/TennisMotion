import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { createThumbnail, Thumbnail } from 'react-native-create-thumbnail';
import { requestGalleryPermission } from '../utils/permissions';
import RNFS from 'react-native-fs';

const storeThumbnailLocally = async (tempThumbnailPath: string) => {
    const fileName = `thumb_${Date.now()}.jpg`;
    const newPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    try {
        console.log('Temp Thumbnail:', tempThumbnailPath);
        await RNFS.moveFile(tempThumbnailPath.replace('file://', ''), newPath);
        console.log('Thumbnail saved at:', newPath);
        //return newPath;
        return `file://${newPath}`;
    } catch (err) {
        console.error('Failed to move thumbnail:', err);
        return null;
    }
};

// Create thumbnail for the video
export const createVideoThumbnail = async (videoUri: string) => {    
    try {
        const thumbnail = await createThumbnail({url: videoUri, timeStamp: 1000});
        // Save in app storage
        const savedPath = await storeThumbnailLocally(thumbnail.path);
        return savedPath;
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        return '';
    }
}

export async function saveVideoToGallery(videoUri: string): Promise<string> {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
        console.warn('No permission to save video.');
        return videoUri;
    }
    try {
        const savedUri = await CameraRoll.save(videoUri, { type: 'video' });
        return savedUri; // This is the permanent URI (e.g., ph://... or content://...)
    } catch (error) {
        console.error('Failed to save video to gallery:', error);
        throw error; // Let the caller handle the error
    }
}
