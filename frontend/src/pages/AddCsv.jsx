import React, { useRef } from "react";

function AddCsv({ apiBase, authHeaders, onImported }) {
  const fileInputRef = useRef(null);

  const handleAddCsvClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiBase}/upload-csv`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      alert(data.message);
      onImported();
    } catch (error) {
      console.error(error);
      alert("Failed to upload CSV");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <button className="import-csv-button" onClick={handleAddCsvClick}>
        Import CSV
      </button>

      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}

export default AddCsv;