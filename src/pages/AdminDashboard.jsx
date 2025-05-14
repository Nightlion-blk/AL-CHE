import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/AdminDashboard.css";
import EditProduct from "../components/EditProduct";
import "font-awesome/css/font-awesome.min.css"; 
import AddProduct from "../components/AddProduct";
import axios from "axios";
import { toast } from "react-toastify";
import OrdersAdmin from "../pages/OrdersAdmin";

// Imported images from src/assets
import footerimg from "../assets/footerimg.jpg";
import Accounts from "./Accounts";
import { Navigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Product"); 
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isUserAccountVisible, setIsUserAccountVisible] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const filteredProducts = products.filter((product) =>
    (selectedCategory === "All Products" || product.category === selectedCategory) &&
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserAccount = () => {
    setIsUserAccountVisible((prevState) => !prevState);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const updateStock = (id, newStock) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === id ? { ...product, stock: newStock } : product
      )
    );
  };

  // Add updateStatus function
  const updateStatus = async (id, newStatus) => {
    const originalStatus = products.find(p => p.id === id)?.status || 'Available';
    
    // Optimistically update UI (show the change immediately)
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === id ? { ...product, status: newStatus, updating: true } : product
      )
    );
    
    try {
      // Call your backend API
      const response = await axios.put(
        `http://localhost:8080/api/updateProductStatus/${id}`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        // Update completed - remove updating flag
        setProducts(prevProducts =>
          prevProducts.map(product =>
            product.id === id ? { ...product, status: newStatus, updating: false } : product
          )
        );
        toast.success(`Status updated to ${newStatus}`);
      } else {
        // Revert to original status on failure
        setProducts(prevProducts =>
          prevProducts.map(product =>
            product.id === id ? { ...product, status: originalStatus, updating: false } : product
          )
        );
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      // Revert to original status on error
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === id ? { ...product, status: originalStatus, updating: false } : product
        )
      );
      console.error("Error updating product status:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };
  
  const handleAddProduct = (product) => {
    if (!product.name || !product.price || !product.description) return;
    
    const formattedPrice = `₱${parseFloat(product.price || 0).toFixed(2)}`;
    
    const newProductData = { 
      ...product, 
      id: products.length + 1,
      price: formattedPrice,
      image: product.image,
      stock: product.stock !== undefined ? product.stock : 0,
      status: product.status || 'Available' // Default status
    };
    
    setProducts([...products, newProductData]);
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    setProducts(products.filter((product) => product.id !== id));
    setSelectedProduct(null);
  };

  // Updated handleUpdate with API integration
  const handleUpdate = async (updatedProductData) => {
    // If no updatedProductData is passed, use the editProduct state
    const productToUpdate = updatedProductData || editProduct;
    
    setLoading(true);
    try {
      // Format data for API
      const formData = {
        Name: productToUpdate.name,
        Description: productToUpdate.description,
        Price: parseFloat(productToUpdate.price.replace('₱', '')),
        Category: productToUpdate.category,
        StockQuantity: productToUpdate.stock,
        Status: productToUpdate.status || 'Available',
        // Send image data as Image array (not Images) to match backend schema
        Image: productToUpdate.images || 
               (productToUpdate.image && typeof productToUpdate.image === 'object' ? 
                 [productToUpdate.image] : 
                 [{public_id: 'default', url: productToUpdate.image}])
      };
      
      // Make API call to update product
      const response = await axios.put(
        `http://localhost:8080/api/updateProduct/${productToUpdate.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        // Update local state with the updated product
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === productToUpdate.id ? {
            ...p,
            name: productToUpdate.name,
            description: productToUpdate.description,
            price: `₱${parseFloat(productToUpdate.price.replace('₱', '')).toFixed(2)}`,
            category: productToUpdate.category,
            stock: productToUpdate.stock,
            status: productToUpdate.status || 'Available',
            images: productToUpdate.images || 
                   (productToUpdate.image ? [{public_id: 'default', url: productToUpdate.image}] : []),
            image: productToUpdate.images?.[0]?.url || productToUpdate.image
          } : p)
        );
        
        toast.success("Product updated successfully!");
        
        // Reset edit state and close popup
        setEditProduct(null);
        setShowPopup(false);
        
        // If we're viewing this product, update the selected product
        if (selectedProduct && selectedProduct.id === productToUpdate.id) {
          setSelectedProduct({
            ...selectedProduct,
            name: productToUpdate.name,
            description: productToUpdate.description,
            price: `₱${parseFloat(productToUpdate.price.replace('₱', '')).toFixed(2)}`,
            category: productToUpdate.category,
            stock: productToUpdate.stock,
            status: productToUpdate.status || 'Available',
            images: productToUpdate.images || 
                   (productToUpdate.image ? [{public_id: 'default', url: productToUpdate.image}] : []),
            image: productToUpdate.images?.[0]?.url || productToUpdate.image
          });
        }
      } else {
        toast.error(response.data.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoClick = () => {
    setSelectedTab("Product");
    setSelectedProduct(null);
    setEditProduct(null);
  };

  // Function to refresh products list
  const refreshProducts = () => {
    fetchProduct();
  };

  // Updated API fetch function
  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8080/api/allProducts");
      
      if(response.data.success) {
        const containProducts = response.data.products.map((product) => ({
          id: product._id,
          name: product.Name,
          description: product.Description,
          price: `₱${parseFloat(product.Price).toFixed(2)}`,
          stock: product.StockQuantity,
          category: product.Category,
          status: product.Status || 'Available',
          // Handle Image field correctly (which is now an array)
          images: product.Image || [],
          // Keep the first image as the main display image for backwards compatibility
          image: product.Image?.[0]?.url || '',
        }));
        setProducts(containProducts);
        console.log("Products fetched successfully:", containProducts);
        toast.success("Products fetched successfully");
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(`Error: ${error.response?.status === 404 ? "API endpoint not found" : error.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  // Added effect to fetch products on component mount
  useEffect(() => {
    refreshProducts();
  }, []);

  // Function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Available':
        return '#4CAF50'; // green
      case 'Not Available':
        return '#FF9800'; // orange
      case 'Deleted':
        return '#F44336'; // red
      default:
        return '#4CAF50'; // green by default
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="header">
        <div className="logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
          Al <span className="heart">♥</span> Che Pastry
        </div>
        <div className="header-buttons">
          <button className={`header-button ${selectedTab === "Product" ? "active" : ""}`} onClick={() => setSelectedTab("Product")}>Product</button>
          <button className={`header-button ${selectedTab === "Accounts" ? "active" : ""}`} onClick={() => setSelectedTab("Accounts")}>Accounts</button>
          <button className={`header-button ${selectedTab === "Orders" ? "active" : ""}`} onClick={() => setSelectedTab("Orders")}>Orders</button>
        </div>
        <div className="user-account">
          <button className="user-icon" onClick={toggleUserAccount}>
            <i className="fa fa-user"></i>
          </button>
          {isUserAccountVisible && (
            <div className="account-details">
              <p>User: Admin</p>
              <p>Email: admin@example.com</p>
              <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Product Tab */}
      {selectedTab === "Product" && !selectedProduct && (
        <>
          <h2 className="title">Product List</h2>
          <div className="product-section">
            <div className="product-list">
              <div className="controls">
                <select className="dropdown" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option>All Products</option>
                  <option>Cake</option>
                  <option>Cookie</option>
                </select>
                
                <input
                  type="text"
                  className="search-bar"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="add-product-button" onClick={() => setShowAddForm(true)}>
                  Add Product
                </button>
              </div>

              <div className="products-container" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                {loading ? (
                  <p>Loading products...</p>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <div 
                      key={product.id || `product-${index}`}
                      className="product-card"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="product-card-image"
                      />
                      <h3>{product.name}</h3>
                      <p className="category">{product.category}</p>
                      <p className="price">{product.price}</p>
                      <div className="product-controls">
                        <p className="stock">Stock: 
                          <input
                            type="number"
                            min="0"
                            value={product.stock}
                            onClick={(e) => e.stopPropagation()} // Prevent parent onClick from triggering
                            onChange={(e) => updateStock(product.id, Number(e.target.value))}
                            className="stock-input"
                          />
                        </p>
                        <p className="status">Status:  
                          <select
                            value={product.status || 'Available'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateStatus(product.id, e.target.value)}
                            className="status-select"
                            style={{ 
                              backgroundColor: getStatusColor(product.status),
                              borderRadius: '5px',     
                              padding: '0px 4px', 
                              paddingLeft: '4.5px',      // Reduced padding
                              border: 'none',           
                              color: 'white',           
                              fontWeight: '500',        
                              fontSize: '0.8rem',       // Smaller font size
                              cursor: 'pointer',
                              height: '18px',           // Explicitly set height
                              lineHeight: '1',
                              textAlign: 'center',
                              marginTop: '8px',          // Improved vertical alignment
                              marginLeft: '4px'           // Improved vertical alignment
                            }}
                          >
        
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                            <option value="Deleted">Deleted</option>
                          </select>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No products found.</p>
                )}
              </div>
            </div>

            {/* Add Form Side */}
            {showAddForm && (
              <AddProduct
                setShowAddForm={setShowAddForm}
                refreshProducts={refreshProducts}  // Updated to use refreshProducts
              />
            )}
          </div>
        </>
      )}

      {/* Product Detail View */}
      {selectedTab === "Product" && selectedProduct && (
        <div className="product-section" style={{ gap: '5px' }}>
          <div className="product-detail-view">
            <button className="back-button" onClick={() => setSelectedProduct(null)}>Back</button>
            <div className="product-detail">
              <div className="product-image-container">
                {/* Main large image */}
                <img src={selectedProduct.image} alt={selectedProduct.name} />
                
                {/* Thumbnail gallery for additional images */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="image-thumbnails" style={{ 
                    display: 'flex', 
                    overflowX: 'auto', 
                    gap: '10px', 
                    marginTop: '10px' 
                  }}>
                    {selectedProduct.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img.url} 
                        alt={`${selectedProduct.name} view ${idx + 1}`}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: img.url === selectedProduct.image ? '2px solid #ec4899' : '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        onClick={() => setSelectedProduct({
                          ...selectedProduct,
                          image: img.url
                        })}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="product-info">
                <h2>{selectedProduct.name}</h2>
                <p className="category">Category: {selectedProduct.category}</p>
                <p className="price">Price: {selectedProduct.price}</p>
                <p className="stock">Stock: {selectedProduct.stock !== undefined ? selectedProduct.stock : 0}</p>
                <p className="status">
                  Status: 
                  <span style={{
                    backgroundColor: getStatusColor(selectedProduct.status),
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                    color: 'white'
                  }}>
                    {selectedProduct.status || 'Available'}
                  </span>
                </p>
                <p className="description" style={{ marginTop: '10px', textAlign: 'justify', lineHeight: '1.5', width: '100%', maxWidth: 'none' }}>{selectedProduct.description}</p>
                <div className="product-actions" style={{ marginTop: '15px' }}>
                  <button 
                    onClick={() => setEditProduct(selectedProduct)}
                    style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedProduct.id)}
                    style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          {editProduct && (
            <EditProduct 
              editProduct={editProduct} 
              setEditProduct={setEditProduct} 
              handleUpdate={handleUpdate} 
            />
          )}
        </div>
      )}
        
      {/* Popup Confirmation */}
      {showPopup && (
        <div className="popup">
          <p>Update Pastry?</p>
          <button onClick={() => setShowPopup(false)}>Cancel</button>
          <button onClick={handleUpdate}>Update</button>
        </div>
      )}

      {/* Accounts Tab */}
      {selectedTab === "Accounts" && (
        <div className="accounts-section">
          <Accounts />
        </div>
      )}

      {/* Orders Tab */}
      {selectedTab === "Orders" && (
        <div className="orders-section">
          <OrdersAdmin />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;