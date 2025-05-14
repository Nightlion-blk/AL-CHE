import React, { useState, useEffect } from "react";
import "../style/AdminDashboard.css";
import axios from "axios";
import { toast } from "react-toastify";

const AddProduct = ({ setShowAddForm, refreshProducts }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Cake");
  const [image, setImage] = useState(null);
  const [stock, setStock] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Close form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".add-product-form")) {
        setShowAddForm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowAddForm]);
  const handleAddProduct = async () => {
    try {
      setIsUploading(true);
      
      // Upload image to Cloudinary first
      let imageUrl = "";
      if (image) {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append("file", image);
        cloudinaryFormData.append("upload_preset", "EcommercePic");
        
        const cloudinaryResponse = await axios.post(
          "https://api.cloudinary.com/v1_1/dtgmwaiya/image/upload",
          cloudinaryFormData
        );
        imageUrl = cloudinaryResponse.data.secure_url;
      }
  

      const productData = {
        Name: name,                     // Capitalized to match schema
        Description: description,
        Price: parseFloat(price),       // Convert to number
        Category: category,
        StockQuantity: parseInt(stock), // Changed to match schema field name
        ProductID: "PROD_" + Date.now(), // Generate unique ID    // Add required field
        Image: {
          public_id: imageUrl ? imageUrl.split('/').pop().split('.')[0] : "default_id",
          url: imageUrl || "default_url"
        }
      };
  
      console.log("Product Data:", productData);
      
      const response = await axios.post(
        "http://localhost:8080/api/addProduct",
        productData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.status === 201) {
        toast.success("Product added successfully");
        resetForm();
        refreshProducts();
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      
      if (error.response && error.response.data) {
        toast.error(`Failed to add product: ${error.response.data.message || error.message}`);
      } else {
        toast.error("Failed to add product: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsUploading(false);
    }
  };  
  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setCategory("Cake");
    setImage(null);
    setImagePreview(null);
    setStock("");
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePriceChange = (e) => {
    let value = e.target.value;
    
    // Remove all non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, "");
  
    // Prevent multiple decimal points
    if ((value.match(/\./g) || []).length > 1) {
      value = value.substring(0, value.length - 1);
    }
  
    // Remove leading zeros unless it's "0."
    if (value && !value.startsWith("0.")) {
      value = value.replace(/^0+/, "");
    }
  
    // Limit to two decimal places
    const parts = value.split(".");
    if (parts.length > 1) {
      value = parts[0] + "." + parts[1].slice(0, 2);
    }
  
    setPrice(value);
  };

  const handlePriceBlur = () => {
    if (price === '') return;
    if (!isNaN(price)) {
      setPrice(parseFloat(price).toFixed(2));
    }
  };

  return (
    <div className="add-product-form" onClick={(e) => e.stopPropagation()}>
      <h2>Add Product</h2>
  
      {/* Image Upload */}
      <div className="form-group">
        <label>Image</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          disabled={isUploading}
        />
        {imagePreview && (
          <img src={imagePreview} alt="Preview" className="image-preview" />
        )}
        {isUploading && <p>Uploading image...</p>}
      </div>
  
      {/* Pastry Name */}
      <div className="form-group">
        <label>Pastry Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
  
      {/* Pastry Category */}
      <div className="form-group">
        <label>Pastry Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Cake">Cake</option>
          <option value="Cookie">Cookie</option>
        </select>
      </div>
  
      {/* Pastry Description */}
      <div className="form-group">
        <label>Pastry Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Pastry Price */}
      <div className="form-group">
        <label>Pastry Price</label>
        <div className="price-input-group">
          <div className="price-wrapper">
            <span className="peso-symbol">₱</span>
            <input
              type="text"
              value={price}
              placeholder="0.00"
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter, arrows
                if ([8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) {
                  return;
                }
                // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                if (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) {
                  return;
                }
                // Allow: numbers 0-9
                if ((e.keyCode >= 48 && e.keyCode <= 57) || 
                    (e.keyCode >= 96 && e.keyCode <= 105)) {
                  return;
                }
                // Allow: single decimal point
                if (e.keyCode === 190 && !e.target.value.includes('.')) {
                  return;
                }
                // Prevent all other keys
                e.preventDefault();
              }}
              onChange={handlePriceChange}
              onBlur={handlePriceBlur}
            />
          </div>
        </div>
      </div>

      {/* Pastry Stock */}
      <div className="form-group">
        <label>Pastry Stock</label>
        <input
          type="number"
          min="0"
          value={stock}
          placeholder="0"
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d*$/.test(value)) {
              setStock(value);
            }
          }}
        />
      </div>

      {/* Buttons */}
      <div className="add-button-group">
        <button 
          className="back-button" 
          onClick={() => setShowAddForm(false)}
          disabled={isUploading}
        >
          Back
        </button>
        <button 
          className="add-button" 
          onClick={() => setShowPopup(true)}
          disabled={isUploading || !name || !price || !description || !image}
        >
          {isUploading ? "Processing..." : "Add"}
        </button>
      </div>

      {/* Popup Confirmation */}
      {showPopup && (
        <div className="popup">
          <p>Add this pastry?</p>
          <button onClick={() => setShowPopup(false)}>Cancel</button>
          <button onClick={handleAddProduct}>Confirm</button>
        </div>
      )}
    </div> 
  );
};

export default AddProduct;