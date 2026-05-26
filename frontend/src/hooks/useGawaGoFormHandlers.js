import { sanitizePhilippinesPhone } from "../utils/formatters";
import { readFileAsDataUrl } from "../utils/mediaUtils";
import { normalizeBarangayName } from "../utils/locationUtils";

export function useGawaGoFormHandlers({
  setHouseholdForm,
  setHouseholdJobCoordinates,
  setHouseholdJobForm,
  setHouseholdJobLocationPreview,
  setHouseholdProfileForm,
  setLoginForm,
  setVerificationForm,
  setWorkerForm,
  setWorkerProfileForm,
  syncHouseholdJobBarangayLocation,
}) {
  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleWorkerChange(event) {
    const { name, value } = event.target;
    if (name === "phone") {
      setWorkerForm((prev) => ({
        ...prev,
        phone: sanitizePhilippinesPhone(value),
      }));
      return;
    }
    if (name === "customSkill") {
      setWorkerForm((prev) => ({
        ...prev,
        customSkill: value,
      }));
      return;
    }
    if (name === "barangay") {
      const barangay = normalizeBarangayName(value);
      setWorkerForm((prev) => ({
        ...prev,
        barangay,
        streetAddress: barangay && !prev.streetAddress ? `Barangay ${barangay}, Tayabas City` : prev.streetAddress,
      }));
      return;
    }
    setWorkerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleHouseholdChange(event) {
    const { name, value } = event.target;
    if (name === "phone") {
      setHouseholdForm((prev) => ({
        ...prev,
        phone: sanitizePhilippinesPhone(value),
      }));
      return;
    }
    setHouseholdForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleHouseholdProfileChange(event) {
    const { name, value, files } = event.target;
    if (name === "profilePhoto") {
      const file = files?.[0];
      if (!file) {
        setHouseholdProfileForm((prev) => ({
          ...prev,
          profilePhotoFile: null,
          profilePhotoName: "",
          profilePhotoPreview: "",
        }));
        return;
      }
      setHouseholdProfileForm((prev) => ({
        ...prev,
        profilePhotoFile: file,
        profilePhotoName: file.name,
        profilePhotoPreview: "",
      }));
      readFileAsDataUrl(file)
        .then((preview) =>
          setHouseholdProfileForm((prev) => ({
            ...prev,
            profilePhotoFile: file,
            profilePhotoName: file.name,
            profilePhotoPreview: preview,
          })),
        )
        .catch(() =>
          setHouseholdProfileForm((prev) => ({
            ...prev,
            profilePhotoPreview: "",
          })),
        );
      return;
    }
    setHouseholdProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleHouseholdJobChange(event) {
    const { name, value } = event.target;
    if (name === "barangay") {
      setHouseholdJobForm((prev) => ({
        ...prev,
        barangay: value,
        streetAddress: value ? `Barangay ${value}, Tayabas City` : prev.streetAddress,
      }));
      if (value) {
        syncHouseholdJobBarangayLocation(value);
      } else {
        setHouseholdJobCoordinates(null);
        setHouseholdJobLocationPreview(null);
      }
      return;
    }
    if (name === "streetAddress") {
      setHouseholdJobCoordinates(null);
      setHouseholdJobLocationPreview(null);
    }
    setHouseholdJobForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleWorkerProfileChange(event) {
    const { name, value, type, checked, files } = event.target;
    if (name === "profilePhoto") {
      const file = files?.[0];
      if (!file) {
        setWorkerProfileForm((prev) => ({
          ...prev,
          profilePhotoFile: null,
          profilePhotoPreview: "",
        }));
        return;
      }
      setWorkerProfileForm((prev) => ({
        ...prev,
        profilePhotoFile: file,
        profilePhotoPreview: "",
      }));
      readFileAsDataUrl(file)
        .then((preview) =>
          setWorkerProfileForm((prev) => ({
            ...prev,
            profilePhotoFile: file,
            profilePhotoPreview: preview,
          })),
        )
        .catch(() =>
          setWorkerProfileForm((prev) => ({
            ...prev,
            profilePhotoPreview: "",
          })),
        );
      return;
    }
    setWorkerProfileForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleVerificationChange(event) {
    const { name, value, files } = event.target;
    if (name === "primaryId") {
      const file = files?.[0];
      if (!file) {
        setVerificationForm((prev) => ({
          ...prev,
          primaryIdName: "",
          primaryIdPreview: "",
        }));
        return;
      }
      setVerificationForm((prev) => ({
        ...prev,
        primaryIdName: file.name,
        primaryIdPreview: "",
      }));
      readFileAsDataUrl(file)
        .then((preview) =>
          setVerificationForm((prev) => ({
            ...prev,
            primaryIdName: file.name,
            primaryIdPreview: preview,
          })),
        )
        .catch(() =>
          setVerificationForm((prev) => ({
            ...prev,
            primaryIdPreview: "",
          })),
        );
      return;
    }
    if (name === "secondaryDoc") {
      const file = files?.[0];
      if (!file) {
        setVerificationForm((prev) => ({
          ...prev,
          secondaryDocName: "",
          secondaryDocPreview: "",
        }));
        return;
      }
      setVerificationForm((prev) => ({
        ...prev,
        secondaryDocName: file.name,
        secondaryDocPreview: "",
      }));
      readFileAsDataUrl(file)
        .then((preview) =>
          setVerificationForm((prev) => ({
            ...prev,
            secondaryDocName: file.name,
            secondaryDocPreview: preview,
          })),
        )
        .catch(() =>
          setVerificationForm((prev) => ({
            ...prev,
            secondaryDocPreview: "",
          })),
        );
      return;
    }
    setVerificationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function toggleSkill(skill) {
    setWorkerForm((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  }

  function toggleWorkerProfileSkill(skill) {
    setWorkerProfileForm((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  }

  return {
    handleHouseholdChange,
    handleHouseholdJobChange,
    handleHouseholdProfileChange,
    handleLoginChange,
    handleVerificationChange,
    handleWorkerChange,
    handleWorkerProfileChange,
    toggleSkill,
    toggleWorkerProfileSkill,
  };
}
