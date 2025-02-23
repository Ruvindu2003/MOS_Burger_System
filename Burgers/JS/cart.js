
// Initialize cart as an empty array or retrieve existing cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Save the cart to localStorage
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Add an item to the cart
function addToCart(categoryId, itemId) {
    console.log(`Attempting to add item: categoryId=${categoryId}, itemId=${itemId}`);

    const category = foods.find(food => food.id === categoryId);
    if (!category) {
        console.error(`Category with ID ${categoryId} not found.`);
        return;
    }

    const item = category.items.find(item => item.id === itemId);
    if (!item) {
        console.error(`Item with ID ${itemId} not found in category ${categoryId}.`);
        return;
    }

    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.categoryId === categoryId);
    if (existingItem) {
        existingItem.quantity += 1; // Increment the quantity if item exists
        console.log(`Updated quantity for ${item.name} to ${existingItem.quantity}`);
    } else {
        cart.push({
            ...item,
            categoryId,
            quantity: 1
        });
        console.log(`Added new item to cart: ${item.name}`);
    }
    saveCart(); // Save the updated cart to localStorage
    renderCart(); // Render the updated cart

    // Send the updated cart to the backend
    sendOrderToBackend(item, existingItem);
}


    console.log('Payload:', payload);

    function sendOrderToBackend(item, existingItem) {
        const payload = {
            id: item.id,
            name: item.name,
            qty: existingItem ? existingItem.quantity : 1,
            unitPrice: item.price,
            total: (existingItem ? existingItem.quantity : 1) * item.price
        };
    
        console.log('Payload:', payload);
    
        fetch("http://localhost:8080/Order/Order-add", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
            
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Successfully sent order to backend:', data);
        })
        .catch(error => {
            console.error('Error sending order to backend:', error.message || error);
        });
    }

// Remove an item from the cart
function removeItemFromCart(categoryId, itemId) {
    
    console.log(`Attempting to remove item: categoryId=${categoryId}, itemId=${itemId}`);
    cart = cart.filter(cartItem => !(cartItem.id === itemId && cartItem.categoryId === categoryId));

    saveCart();
    renderCart();

    // Send delete request to backend
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({});

    const requestOptions = {
        method: "DELETE",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch(`http://localhost:8080/Order-Delete/${itemId}`, requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
}

// Update the quantity of an item in the cart
function changeNumberOfUnits(categoryId, itemId, newQuantity) {
    const item = cart.find(cartItem => cartItem.id === itemId && cartItem.categoryId === categoryId);
    if (item) {
        item.quantity = newQuantity;
        if (item.quantity <= 0) {
            removeItemFromCart(categoryId, itemId);
        } else {
            saveCart();
            renderCart();
        }
    }
}

// Render the cart contents
function renderCart() {
    const cartContainer = document.getElementById("cart-items");
    const subtotalElement = document.getElementById("subtotal");
    if (!cartContainer || !subtotalElement) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = `<p>Your cart is empty</p>`;
        return;
    }

    let cartHTML = "";
    let subtotal = 0;
    let totalItems = 0;

    cart.forEach(cartItem => {
        const itemTotal = cartItem.price * cartItem.quantity;
        subtotal += itemTotal;
        totalItems += cartItem.quantity;
        cartHTML += `
            <div class="cart-item">
                <img src="${cartItem.imgSrc}" alt="${cartItem.name}">
                <div class="cart-item-details">
                    <h4>${cartItem.name}</h4>
                    <p>Price: $${cartItem.price.toFixed(2)}</p>
                    <p>Quantity: 
                        <button onclick="changeNumberOfUnits(${cartItem.categoryId}, ${cartItem.id}, ${cartItem.quantity - 1})">-</button>
                        ${cartItem.quantity}
                        <button onclick="changeNumberOfUnits(${cartItem.categoryId}, ${cartItem.id}, ${cartItem.quantity + 1})">+</button>
                    </p>
                    <p>Total: $${(cartItem.price * cartItem.quantity).toFixed(2)}</p>
                    <button class="remove-btn btn-success" onclick="removeItemFromCart(${cartItem.categoryId}, ${cartItem.id})">Remove</button>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = cartHTML; // Update cart display
    subtotalElement.textContent = `Subtotal (${totalItems} items): $${subtotal.toFixed(2)}`;
}

// Generate checkout report in `checkout.html`
function generateCheckoutReport() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('Cart Items:', cartItems);

    const checkoutBody = document.getElementById('checkoutBody');
    const subtotalElement = document.getElementById('subtotal');

    if (!checkoutBody || !subtotalElement) {
        console.error('Checkout elements not found. Make sure you are on the checkout page.');
        return;
    }

    if (cartItems.length === 0) {
        console.warn('No items found in the cart. Make sure you have added items before checking out.');
        return;
    }

    let subtotal = 0;

    // Clear existing rows if any
    checkoutBody.innerHTML = '';

    console.log('Starting to render items...');
    cartItems.forEach(item => {
        const total = item.price * item.quantity;
        subtotal += total;

        console.log(`Rendering item: ${item.name}, Quantity: ${item.quantity}, Unit Price: ${item.price}, Total: ${total}`);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${total.toFixed(2)}</td>
        `;
        checkoutBody.appendChild(row);
    });

    subtotalElement.textContent = subtotal.toFixed(2);
    console.log('Subtotal:', subtotal);
}

// Confirm checkout
function confirmCheckout() {
    if (confirm("Are you sure you want to complete the checkout?")) {
        // Clear the cart only after confirmation
        localStorage.removeItem('cart'); 
        window.location.href = 'orderConfirmation.html'; // Redirect to order confirmation page
    }
}

// Load checkout report when `checkout.html` loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('checkoutTable')) {
        console.log('Checkout table found, generating report...');
        generateCheckoutReport();
    } else {
        console.error('Checkout table not found. Make sure you are on the checkout page.');
    }
});
async function confirmCheckout() {
    if (confirm("Are you sure you want to complete the checkout?")) {
        // Generate PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add content to the PDF
        doc.setFontSize(20);
        doc.text("Order Confirmation", 20, 20);
        doc.setFontSize(12);
        doc.text("Here are your order details:", 20, 30);

        // Get cart items from local storage
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        let y = 40; // Starting Y position for items

        // Loop through cart items and add to PDF
        cartItems.forEach(item => {
            doc.text(`Name: ${item.name}`, 20, y);
            doc.text(`Quantity: ${item.quantity}`, 20, y + 10);
            doc.text(`Price: $${item.price.toFixed(2)}`, 20, y + 20);
            y += 30; // Move down for the next item
        });

        // Save the PDF
        doc.save("order_confirmation.pdf");

        // Clear cart only if confirmed
        localStorage.removeItem('cart');
        window.location.href = 'index.html'; // Redirect to order confirmation page
    }
}

