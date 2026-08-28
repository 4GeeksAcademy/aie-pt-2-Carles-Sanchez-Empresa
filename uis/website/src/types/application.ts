export type ProductType = "" | "Moda" | "Electrónica" | "Cosmética" | "Alimentación" | "Otro";
export type VolumeType = "" | "0-100" | "101-500" | "501-2000" | "2000+" | "No estoy seguro";
export type CountryType = "" | "Estados Unidos" | "España" | "Ambos" | "Otro";
export type ServiceType = "Almacenaje" | "Última milla" | "Logística inversa";
export type Other3plType = "" | "Sí" | "No" | "Estoy evaluando opciones";

export interface ApplicationFormData {
  empresa: string;
  contacto: string;
  email: string;
  telefono: string;
  web: string;
  pais: CountryType;
  producto: ProductType;
  volumen: VolumeType;
  servicios: ServiceType[];
  otro_3pl: Other3plType;
  comentarios: string;
  politica_privacidad: boolean;
}

export type FormFieldKey = keyof ApplicationFormData | "servicios" | "otro_3pl";
export type FormErrors = Partial<Record<FormFieldKey, string>>;
