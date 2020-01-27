import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable()
export class ToastService {

  constructor(private toastController: ToastController) { }

  async presentToast(msgText: string) {
    const toast = await this.toastController.create({
      message: msgText,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }
}
