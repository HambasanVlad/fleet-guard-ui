export const validateTruck = (truck) => {
  const errors = {};
  
  const plateRegex = /^[A-Z]{1,2}\s\d{2,3}\s[A-Z]{3}$/;
  if (!plateRegex.test(truck.licensePlate)) {
    errors.licensePlate = "Format invalid! Ex: B 123 ABC";
  }

  if (!truck.brand) errors.brand = "Brandul este obligatoriu.";

  // MODIFICARE: Verificăm doar dacă datele există. 
  // Eliminăm verificarea ">=" deoarece în App.js le setezi ca fiind egale.
  if (!truck.rcaExpiry) errors.rca = "Data RCA este obligatorie.";
  if (!truck.itpExpiry) errors.itp = "Data ITP este obligatorie.";
  if (!truck.rovinietaExpiry) errors.rovinieta = "Data Rovinietă este obligatorie.";

  return errors;
};