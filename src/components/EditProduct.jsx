import React, { useState, useEffect } from "react";
import "../style/AdminDashboard.css";
import axios from "axios";

const EditProduct = ({ editProduct, setEditProduct, handleUpdate }) => {
  const [updatedProduct, setUpdatedProduct] = useState({
    ...editProduct
  });
  const [showPopup, setShowPopup] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedImages, setSelectedImages] = useState(
    editProduct.images || (editProduct.image ? [{ public_id: 'default', url: editProduct.image }] : [])
  );

  // Close form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".edit-product-form")) {
        setEditProduct(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setEditProduct]);

  // Image Upload Function
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    // Show local preview first
    const reader = new FileReader();
    reader.onloadend = () => {
      setUpdatedProduct(prev => ({ 
        ...prev, 
        previewImage: reader.result // Store preview separately
      }));
    };
    reader.readAsDataURL(file);
  
    // Start upload to Cloudinary
    setUploading(true);
    setUploadError("");
  
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append("upload_preset", "EcommercePic");
  
      // Upload to Cloudinary
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dtgmwaiya/image/upload",
        formData
      );
  
      // Update product with Cloudinary URL
      setUpdatedProduct(prev => ({ 
        ...prev,
        image: response.data.secure_url,
        imagePublicId: response.data.public_id // Store public_id separately if needed
      }));
      
      setUploading(false);
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploadError("Failed to upload image. Please try again.");
      setUploading(false);
    }
  };

  const handleAddImage = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setUploading(true);
      setUploadError("");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "EcommercePic");

        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dtgmwaiya/image/upload",
          formData
        );

        setSelectedImages((prevImages) => [
          ...prevImages,
          { public_id: response.data.public_id, url: response.data.secure_url }
        ]);

        setUploading(false);
      } catch (error) {
        console.error("Image upload failed:", error);
        setUploadError("Failed to upload image. Please try again.");
        setUploading(false);
      }
    };
    fileInput.click();
  };

  return (
    <div className="edit-product-form">
      <h2>Edit Product</h2>

      <label>Pastry Name</label>
      <input 
        type="text" 
        value={updatedProduct.name} 
        onChange={(e) => setUpdatedProduct({ ...updatedProduct, name: e.target.value })} 
      />

      <div className="form-group price-input-group">
        <label>Pastry Price</label>
        <div className="price-wrapper">
          <span className="peso-symbol">₱</span>
          <input
            type="text"
            value={updatedProduct.price}
            placeholder="0.00"
            onChange={(e) => {
              // Remove all non-numeric characters except decimal point
              let value = e.target.value.replace(/[^0-9.]/g, "");
              
              // Prevent multiple decimal points
              if ((value.match(/\./g) || []).length > 1) {
                return;
              }

              // Format the value
              if (value) {
                // Remove leading zeros
                value = value.replace(/^0+/, '');
                // Ensure proper decimal formatting
                const parts = value.split('.');
                if (parts.length > 1) {
                  value = parts[0] + '.' + parts[1].slice(0, 2);
                }
              }

              setUpdatedProduct({ ...updatedProduct, price: value });
            }}
            onBlur={(e) => {
              // Format to 2 decimal places when leaving the field
              if (e.target.value && !isNaN(e.target.value)) {
                const formattedValue = parseFloat(e.target.value).toFixed(2);
                setUpdatedProduct({ ...updatedProduct, price: formattedValue });
              }
            }}
          />
        </div>
      </div>

      <label>Pastry Description</label>
      <textarea 
        value={updatedProduct.description} 
        onChange={(e) => setUpdatedProduct({ ...updatedProduct, description: e.target.value })}>
      </textarea>

      <label>Pastry Category</label>
      <select 
        value={updatedProduct.category} 
        onChange={(e) => setUpdatedProduct({ ...updatedProduct, category: e.target.value })}>
        <option>Cake</option>
        <option>Cookie</option>
      </select>

      {/* Image Upload Section */}
      <label>Image</label>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      
      {uploading && <p className="upload-status">Uploading image...</p>}
      {uploadError && <p className="upload-error">{uploadError}</p>}

      {/* Image Preview */}
      {(updatedProduct.previewImage || updatedProduct.image) && (
        <img 
          src={updatedProduct.previewImage || updatedProduct.image} 
          alt="Preview" 
          className="image-preview" 
        />
      )}

      {/* Multiple Images Management */}
      <div className="form-group">
        <label>Product Images:</label>
        <div className="image-preview-container">
          {selectedImages.map((image, index) => (
            <div key={index} className="image-preview">
              <img src={image.url} alt={`Product preview ${index + 1}`} />
              <button 
                type="button" 
                className="remove-image" 
                onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
              >
                ✖
              </button>
            </div>
          ))}
          <button type="button" className="add-image-button" onClick={handleAddImage}>
            Add Image
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => setEditProduct(null)}>Back</button>
        <button 
          onClick={() => setShowPopup(true)} 
          disabled={uploading}
        >
          Update
        </button>
      </div>

      {/* Confirmation Popup */}
      {showPopup && (
        <div className="popup">
          <p>Update Pastry?</p>
          <button onClick={() => setShowPopup(false)}>Cancel</button>
          <button onClick={() => {
            // Format price to 2 decimal places before submitting
            const formattedProduct = {
              ...updatedProduct,
              price: parseFloat(updatedProduct.price || 0).toFixed(2),
              stock: updatedProduct.stock !== undefined ? parseInt(updatedProduct.stock) : editProduct.stock,
              // Remove preview image since it's just for UI
              previewImage: undefined,
              images: selectedImages
            };
            handleUpdate(formattedProduct);
            setEditProduct(null);
          }}>Update</button>
        </div>
      )}
    </div>
  );
};

export default EditProduct;