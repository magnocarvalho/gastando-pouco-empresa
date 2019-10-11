import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LocationService } from 'src/app/services/location.service';
import { MapsAPILoader } from '@agm/core';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { Location } from '@angular-material-extensions/google-maps-autocomplete';
declare var google: any

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  form: FormGroup;
  private geocoder: any;
  public zoom: number;
  public latitude: number;
  public longitude: number;
  public selectedAddress: google.maps.places.PlaceResult;
  public tiposCarregados = [];
  public mascaraCnpj: String = "00.000.000/0000-00";
  constructor(private rota: Router, public api: ApiService, public snackBar: MatSnackBar, private formBuilder: FormBuilder, private mapLoader: MapsAPILoader, private reverso: LocationService) {
    this.form = this.formBuilder.group({
      rua: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      numero: ["", [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      bairro: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cidade: [{ value: "", disabled: true }, , [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      estado: [{ value: "", disabled: true }, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      pais: [{ value: "", disabled: true }, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cep: [{ value: "", disabled: true }, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cnpj: ["", [Validators.required, Validators.maxLength(22)]],
      complemento: [""],
      tipo: ["", [Validators.required]],
      googlePlace: ["", [Validators.required]]
    });
    this.carregarDados()
  }

  ngOnInit() {
    this.setCurrentPosition();
  }
  private setCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.zoom = 16;
        // this.reverseGeo(this.latitude, this.longitude);
      });
    }
  }
  async carregarDados() {
    setTimeout(() => {
      this.api.getTipos().subscribe(res => {
        this.tiposCarregados = res;
      })
    }, 1000);

  }

  public reverseGeo(lat, lng) {
    this.reverso.getReverseGeocode(lat, lng).subscribe(location => {
      this.latitude = lat;
      this.longitude = lng;
      this.form.get('googlePlace').setValue(location.results[0].formatted_address);
      this.onAutocompleteSelected(location.results[0])
    })
  }
  onAutocompleteSelected(result: google.maps.places.PlaceResult) {

    const filterResponse = result.address_components.reduce((current, next) => {
      const mapKeys = {
        street_number: 'address_number',
        route: 'address',
        sublocality_level_1: 'neighborhood',
        administrative_area_level_2: 'city',
        administrative_area_level_1: 'state',
        country: 'country',
        postal_code: 'zipcode'
      }

      const [validKey] = next.types.filter(key => Object.keys(mapKeys).includes(key))

      if (!validKey) return current

      return {
        ...current,
        [mapKeys[validKey]]: next.long_name
      }
    }, {})

    this.form.get('rua').setValue(filterResponse['address']);
    this.form.get('pais').setValue(filterResponse['country']);
    this.form.get('numero').setValue(filterResponse['address_number']);
    this.form.get('bairro').setValue(filterResponse['neighborhood']);
    this.form.get('cep').setValue(filterResponse['zipcode']);
    this.form.get('estado').setValue(filterResponse['state']);
    this.form.get('cidade').setValue(filterResponse['city']);

  }

  onLocationSelected(location: Location) {

    this.latitude = location.latitude;
    this.longitude = location.longitude;
  }

  async salvarDados() {
    if (this.form.valid) {
      // console.log(this.form.value)
      var uid = await this.api.firebaseUser.uid;
      if (uid) {
        var obj = this.form.value
        obj.uid = uid;
        obj.cep = this.form.get('cep').value
        obj.cidade = this.form.get('cidade').value
        obj.pais = this.form.get('pais').value
        obj.estado = this.form.get('estado').value
        obj.location = { coordinates: [this.latitude, this.longitude], type: 'Point' }
        console.log(obj)
        this.api.createUser(obj).subscribe(res => {
          console.log('Usuario Criado', res)
          this.rota.navigate(['adm'])
        }, error => {
          this.snackBar.open(error.message, 'error', { duration: 5000 })
        })
      }
    } else {
      this.form.markAllAsTouched()
      console.error(this.form.value)
    }
  }

  clickEventNow(event) {
    this.reverseGeo(event.coords.lat, event.coords.lng);
    // console.log(event.coords)
  }


}
