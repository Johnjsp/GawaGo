import React from "react";
import { BARANGAYS } from "../constants/appConstants";

export function renderBarangayOptions() {
  return BARANGAYS.map((barangay) => (
    <option key={barangay} value={barangay}>
      {barangay}
    </option>
  ));
}
