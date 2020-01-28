import { Injectable, ApplicationRef } from '@angular/core';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/camera/ngx';
import { ToastService } from './toast.service';
import { LoaderService } from './loader.service';
import { ActionSheetController, Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { Crop } from '@ionic-native/crop/ngx';

@Injectable()
export class PhotoService {

  public arrPhotos: Photo[] = [];

  constructor(private camera: Camera, private loaderService: LoaderService, private file: File, private crop: Crop,
              private toastService: ToastService, private actionSheetController: ActionSheetController, private webview: WebView,
              private ref: ApplicationRef, private filePath: FilePath, private platform: Platform) { }

  loadSaved() {
    this.loaderService.present();
    const arr = localStorage.getItem('photos');
    this.arrPhotos = arr ? JSON.parse(arr) : [];
    this.loaderService.dismiss();
  }

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image source',
      buttons: [{
        text: 'Load from Library',
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
        }
      }, {
        text: 'Use Camera',
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.CAMERA);
        }
      }, {
        text: 'Cancel',
        role: 'cancel'
      }]
    });
    await actionSheet.present();
  }

  async takePicture(sourceType: PictureSourceType) {
    const options: CameraOptions = {
      quality: 100,
      sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera.getPicture(options).then(imagePath => {
      this.crop.crop(imagePath, { quality: 100 }).then(newImage => {
        if (this.platform.is('android')) {
          this.filePath.resolveNativePath(newImage).then(filePath => {
            const correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
            const currentName = newImage.substring(newImage.lastIndexOf('/') + 1, newImage.lastIndexOf('?'));
            this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
          });
        } else {
          const currentName = newImage.substr(newImage.lastIndexOf('/') + 1);
          const correctPath = newImage.substr(0, newImage.lastIndexOf('/') + 1);
          this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
        }
      }, () => { });
    });
  }

  createFileName(): string {
    const d = new Date();
    const n = d.getTime();
    const newFileName = n + '.jpg';
    return newFileName;
  }

  copyFileToLocalDir(namePath: string, currentName: string, newFileName: string) {
    this.file.moveFile(namePath, currentName, this.file.dataDirectory, newFileName).then(() => {
      this.updateStoredImages(newFileName);
    }, err => {
      this.toastService.presentToast(JSON.stringify(err));
    });
  }

  async updateStoredImages(name: string) {
    const filePath = this.file.dataDirectory + name;
    const resPath = this.pathForImage(filePath);

    const newEntry: Photo = {
      Id: 1,
      Name: name,
      Path: resPath,
      Filepath: filePath
    };
    this.arrPhotos.unshift(newEntry);
    localStorage.setItem('photos', JSON.stringify(this.arrPhotos));
    this.ref.tick();
  }

  pathForImage(img: string) {
    if (img === null) {
      return '';
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  deleteImage(imgEntry: Photo, position: number) {
    this.arrPhotos.splice(position, 1);
    localStorage.setItem('photos', JSON.stringify(this.arrPhotos));
    const correctPath = imgEntry.Filepath.substr(0, imgEntry.Filepath.lastIndexOf('/') + 1);

    this.file.removeFile(correctPath, imgEntry.Name).then(() => {
      this.toastService.presentToast('Image deleted successfully.');
    });
  }
}

class Photo {
  Id: number;
  Name: string;
  Path: string;
  Filepath: string;
}
