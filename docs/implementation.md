# Signup → Login → Create Invoice - Implementation Guide

This document explains the complete flow of how a user **signs up with OTP**, **logs in**, and then **creates an invoice** in the Mandi Plus API, all the way to PDF generation.

## Complete Flow Overview

### STEP 1: User Signup (Registration with OTP)

**Endpoint:** `POST /auth/register`

**DTO:** `RegisterDto`

**Request:**
```json
{
  "name": "John Doe",
  "mobileNumber": "9876543210",
  "state": "MAHARASHTRA"
}
```

**What happens in `AuthService.register`:**
- Checks if a `User` with this `mobileNumber` already exists.
- If not, creates a new `User` with:
  - `name`
  - `mobileNumber`
  - `state`
- Saves the user.
- Generates an OTP via `OtpService.generateOtp(mobileNumber)`.
- Returns: `{ "message": "OTP sent for registration" }`.

---

### STEP 2: Verify Signup OTP & Create Session

**Endpoint:** `POST /auth/register/verify-otp`

**DTO:** `VerifyOtpDto`

**Request:**
```json
{
  "mobileNumber": "9876543210",
  "otp": "1234"
}
```

**What happens in `AuthService.verifyRegisterOtp`:**
- Verifies the OTP using `OtpService.verifyOtp(mobileNumber, otp)`.
- Fetches the `User` by `mobileNumber`.
- Calls `createSession(user, req)` which:
  - Creates a `UserSession` with:
    - `user`
    - `deviceInfo` from `User-Agent` header
    - `ipAddress` from request
    - `expiresAt` ≈ 60 days in future
  - Generates a **refresh token** bound to this session and stores its hash in `UserSession.refreshTokenHash`.
  - Generates an **access token** (JWT) for the user.
- Returns:
```json
{
  "accessToken": "<jwt-access-token>",
  "refreshToken": "<jwt-refresh-token>"
}
```

The frontend should store the `accessToken` (and usually the `refreshToken` in a secure cookie or storage) to call further APIs.

---

### STEP 3: Login for Returning Users (OTP Based)

If the user is already registered and comes back later:

**Endpoint:** `POST /auth/login`

**DTO:** `LoginDto`

```json
{
  "mobileNumber": "9876543210"
}
```

**What happens in `AuthService.login`:**
- Checks that a `User` exists with that `mobileNumber`.
- Generates OTP via `OtpService.generateOtp`.
- Returns: `{ "message": "OTP sent for login" }`.

Then the user verifies the OTP:

**Endpoint:** `POST /auth/login/verify-otp`

**DTO:** `VerifyOtpDto`

**What happens in `AuthController.verifyLoginOtp`:**
- Calls `AuthService.verifyLoginOtp(dto, req)`, which:
  - Verifies OTP.
  - Loads the `User` by `mobileNumber`.
  - Calls `createSession` again (same as registration) to get new tokens.
- The controller:
  - Sets `refreshToken` as **httpOnly cookie**.
  - Returns `{ "accessToken": "<jwt-access-token>" }`.

Once this is done, the user is authenticated and can proceed to create invoices.

---

### STEP 4: Optional - Enrich User Profile

Beyond minimal auth details, you can store richer mandi profile information using the `UsersModule`.

**Endpoint:** `POST /users`

**DTO:** `CreateUserDto`

Example:
```json
{
  "mobileNumber": "+919876543210",
  "secondaryMobileNumber": "+919876543211",
  "name": "John Doe",
  "state": "MAHARASHTRA",
  "identity": "SUPPLIER",
  "products": ["Wheat", "Rice"],
  "loadingPoint": ["Yard 1", "Yard 2"],
  "destinationShopAddress": ["Shop 1 address"],
  "route": ["Route 1"],
  "officeAddress": ["Office address"],
  "destinationAddress": ["Destination address 1"]
}
```

**What happens in `UsersService.create`:**
- Ensures `mobileNumber` is unique.
- Ensures `secondaryMobileNumber` (if provided) is unique.
- Creates and saves a `User` with extended profile fields.

User profile can later be updated via `PATCH /users/:id`.

---

### STEP 5: User Creates Invoice

**Endpoint:** `POST /invoices` (multipart/form-data)

**Request includes:**
- **Form fields:**
  - `invoiceNumber`: "INV-2024-001"
  - `invoiceDate`: "2024-01-15"
  - `supplierName`: "ABC Suppliers"
  - `supplierAddress`: ["123 Main St", "Mumbai"]
  - `billToName`: "XYZ Traders"
  - `billToAddress`: ["456 Market St", "Delhi"]
  - `shipToName`: "XYZ Traders"
  - `shipToAddress`: ["456 Market St", "Delhi"]
  - `productName`: ["Wheat", "Rice"]
  - `quantity`: 100.5
  - `rate`: 50.75
  - `amount`: 5082.50
  - `truckNumber`: "MH12AB1234" ⭐
  - `weighmentSlipNote`: "Optional note"
  - Other optional fields...

- **Files:**
  - `weighmentSlips[]`: One or more image files (up to 10)

---

### STEP 6: Invoice Controller Receives Request

**Location:** `src/modules/invoices/invoices.controller.ts`

```typescript
@Post()
@UseInterceptors(FilesInterceptor('weighmentSlips', 10))
@UsePipes(new ParseFormDataPipe())
```

**What happens:**
- `FilesInterceptor` captures weighment slip files from multipart/form-data
- `ParseFormDataPipe` converts form data:
  - Arrays from JSON strings or comma-separated values
  - String numbers → actual numbers
  - String booleans → actual booleans
- Calls `invoicesService.create()`

---

### STEP 7: Invoice Service - Validate Invoice Number

**Location:** `src/modules/invoices/invoices.service.ts`

**What happens:**
- Checks if invoice number already exists in database
- If duplicate → throws `ConflictException`
- If unique → continues

---

### STEP 8: Handle Truck by Truck Number

**Location:** `src/modules/invoices/invoices.service.ts`

**Logic:**
1. If `truckNumber` is provided:
   - Search database for truck with that number
   - **If found:** Use existing truck
   - **If NOT found:** Create new truck with default values:
     ```typescript
     {
       truckNumber: "MH12AB1234",
       ownerName: "Unknown",           // Default, update later
       ownerContactNumber: "0000000000", // Default, update later
       driverName: "Unknown",          // Default, update later
       driverContactNumber: "0000000000" // Default, update later
     }
     ```
   - Save new truck to database
   - Attach truck to invoice

2. If `truckNumber` is NOT provided:
   - Invoice is created without truck association

---

### STEP 9: Upload Weighment Slips to Cloud Storage

**Location:** `src/modules/invoices/invoices.service.ts`

**What happens:**
1. If weighment slip files are provided:
   - `storageService.uploadMultipleFiles()` is called
   - Files are uploaded to Cloudinary (folder: `mandi-plus/weighment-slips`)
   - Returns array of URLs: 
     ```typescript
     [
       "https://res.cloudinary.com/.../image1.jpg",
       "https://res.cloudinary.com/.../image2.jpg"
     ]
     ```
2. URLs are stored in `weighmentSlipUrls` array field

---

### STEP 10: Create Invoice Record in Database

**Location:** `src/modules/invoices/invoices.service.ts`

**What happens:**
1. Build invoice data object with all fields
2. Convert `productName` array to JSON string (database limitation: column is varchar, not array)
3. Attach truck if provided
4. Save invoice to database
5. Invoice now exists with:
   - ✅ All invoice details
   - ✅ `weighmentSlipUrls`: Array of uploaded image URLs
   - ❌ `pdfUrl`: `null` (will be set later by background job)

---

### STEP 11: Queue PDF Generation Job (Async)

**Location:** `src/modules/invoices/invoices.service.ts`

**What happens:**
```typescript
await this.invoicePdfQueue.add('generate-pdf', {
  invoiceId: savedInvoice.id,
});
```

- Job is added to BullMQ queue (`invoice-pdf` queue)
- Job contains only `invoiceId`
- **API returns immediately** - does NOT wait for PDF generation
- User receives invoice response with `pdfUrl: null`

**Why Async?**
- PDF generation can take time (especially with images)
- Uploading images and generating PDF is CPU-intensive
- Async processing prevents API timeout
- Better user experience (fast response)

---

### STEP 12: BullMQ Processor Picks Up Job (Background)

**Location:** `src/modules/queue/processors/invoice-pdf.processor.ts`

**What happens:**
1. BullMQ worker (running in background) picks up the job
2. `InvoicePdfProcessor.process()` is called
3. Fetches invoice from database:
   ```typescript
   const invoice = await this.invoiceRepository.findOne({
     where: { id: invoiceId },
     relations: ['truck'], // Include truck relationship
   });
   ```
4. Validates invoice exists

---

### STEP 13: Generate PDF with Weighment Slips

**Location:** `src/modules/pdf/pdf.service.ts`

**What happens:**
1. `pdfService.generateInvoicePdf()` is called with:
   - Invoice data (all fields)
   - Array of weighment slip URLs
2. PDFKit creates PDF document
3. Adds invoice header, details, items table
4. **Embeds weighment slip images:**
   - Downloads images from URLs
   - Resizes using Sharp library
   - Embeds in PDF (2 images per row)
   - Handles multiple images across pages if needed
5. Returns PDF as `Buffer`

---

### STEP 14: Upload PDF to Cloud Storage

**Location:** `src/modules/queue/processors/invoice-pdf.processor.ts`

**What happens:**
1. Generate filename: `invoice-{invoiceNumber}-{timestamp}.pdf`
2. Upload PDF buffer to Cloudinary:
   ```typescript
   await this.storageService.uploadPdf(
     pdfBuffer,
     pdfFilename,
     'invoice-pdfs'
   );
   ```
3. Returns PDF URL:
   ```
   https://res.cloudinary.com/.../invoice-INV-2024-001-1703123456789.pdf
   ```

---

### STEP 15: Update Invoice with PDF URL

**Location:** `src/modules/queue/processors/invoice-pdf.processor.ts`

**What happens:**
```typescript
invoice.pdfUrl = pdfUrl;
await this.invoiceRepository.save(invoice);
```

- Updates invoice record in database
- Sets `pdfUrl` field
- ✅ **Invoice is now complete!**

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Signup / Login                                          │
│ POST /auth/register → create user + send OTP                    │
│ POST /auth/register/verify-otp → create session + tokens        │
│ POST /auth/login → send OTP for existing user                   │
│ POST /auth/login/verify-otp → create session + tokens           │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: (Optional) Enrich User Profile                          │
│ POST /users → create/update extended profile fields             │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Create Invoice Request                                  │
│ POST /invoices (multipart/form-data)                            │
│ - Invoice data + weighmentSlips files + truckNumber             │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Controller Processing                                   │
│ - FilesInterceptor captures files                               │
│ - ParseFormDataPipe converts form data                          │
│ - Calls invoicesService.create()                                │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5-8: Invoice Service (Synchronous)                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ STEP 4: Validate invoice number (check duplicate)        │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ STEP 5: Handle truck                                     │   │
│ │   - Find truck by number OR create new truck             │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ STEP 6: Upload weighment slips to Cloudinary             │   │
│ │   - Get array of URLs                                    │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ STEP 7: Save invoice to database                         │   │
│ │   - Invoice saved with weighmentSlipUrls                 │   │
│ │   - pdfUrl = null (not generated yet)                    │   │
│ └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Queue PDF Generation Job                                │
│ - Add job to BullMQ queue (invoice-pdf)                         │
│ - Job contains: { invoiceId: "uuid-here" }                      │
│ - API returns invoice response (pdfUrl = null)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
                    [ASYNC PROCESSING]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: BullMQ Processor (Background)                           │
│ - Worker picks up job                                           │
│ - Fetch invoice from database with truck relation               │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: Generate PDF                                           │
│ - PdfService.generateInvoicePdf()                               │
│ - Download weighment slip images                                │
│ - Create PDF with PDFKit                                        │
│ - Embed images in PDF                                           │
│ - Return PDF as Buffer                                          │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 11: Upload PDF to Cloudinary                               │
│ - Upload PDF buffer                                             │
│ - Get PDF URL                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 12: Update Invoice                                         │
│ - Set invoice.pdfUrl = PDF URL                                  │
│ - Save invoice to database                                      │
│ ✅ Invoice Complete!                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Important Notes

### 1. Async PDF Generation
- PDF generation happens **asynchronously** in the background
- API response returns immediately with `pdfUrl: null`
- PDF URL is available later (typically within seconds)
- User should poll or use webhooks to check when PDF is ready

### 2. Truck Auto-Creation
- If truck with provided number doesn't exist, it's automatically created
- Created truck has default placeholder values:
  - `ownerName`: "Unknown"
  - `ownerContactNumber`: "0000000000"
  - `driverName`: "Unknown"
  - `driverContactNumber`: "0000000000"
- These should be updated later via `PATCH /trucks/:id`

### 3. Weighment Slip Storage
- Images are uploaded to Cloudinary immediately during invoice creation
- URLs are stored in `weighmentSlipUrls` array
- PDF processor downloads these images when generating PDF
- Images are embedded directly in the PDF document

### 4. Error Handling
- If PDF generation fails, job will retry (BullMQ default retry logic)
- Check logs for PDF generation errors
- Invoice remains in database even if PDF generation fails
- PDF can be regenerated by updating the invoice

### 5. Database Fields
- `productName` is stored as JSON string (database limitation)
- `weighmentSlipUrls` is stored as text array
- `pdfUrl` is stored as text (nullable)

---

## API Response Examples

### Create Invoice Response (Immediate)
```json
{
  "id": "uuid-here",
  "invoiceNumber": "INV-2024-001",
  "pdfUrl": null,  // ⚠️ PDF not ready yet
  "weighmentSlipUrls": [
    "https://res.cloudinary.com/.../slip1.jpg",
    "https://res.cloudinary.com/.../slip2.jpg"
  ],
  "truck": {
    "id": "truck-uuid",
    "truckNumber": "MH12AB1234"
  },
  // ... other invoice fields
}
```

### Get Invoice Response (After PDF Generation)
```json
{
  "id": "uuid-here",
  "invoiceNumber": "INV-2024-001",
  "pdfUrl": "https://res.cloudinary.com/.../invoice-INV-2024-001-1234567890.pdf",  // ✅ PDF ready
  "weighmentSlipUrls": [
    "https://res.cloudinary.com/.../slip1.jpg",
    "https://res.cloudinary.com/.../slip2.jpg"
  ],
  // ... other invoice fields
}
```

---

## Prerequisites

1. **Redis Server** must be running (for BullMQ)
2. **Cloudinary** credentials configured in environment
3. **PostgreSQL** database with migrations run
4. **BullMQ Worker** must be running (handled automatically by NestJS)

---

## Environment Variables Required

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_database

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloudinary
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

