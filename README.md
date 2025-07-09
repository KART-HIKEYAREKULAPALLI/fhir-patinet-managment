# FHIR Patient Management App

This is a simple web application for managing patient records, interacting with a FHIR (Fast Healthcare Interoperability Resources) server. It provides a user-friendly interface to perform CRUD (Create, Read, Update, Delete) operations on patient information.

## 🚀 Features

  * **Patient Listing:** Displays a paginated list of patients fetched from the FHIR server.
  * **Patient Search:** Efficiently search for patients using various criteria:
      * By Name (partial match)
      * By Phone Number
      * By Date of Birth
      * By FHIR ID
  * **Create Patient:** Intuitive form to add new patient records with essential demographic details.
  * **Update Patient:** Seamlessly edit existing patient information. Clicking "Edit" on a patient's row transforms the creation form into an update form, pre-filling it with the patient's current data.
  * **Delete Patient:** Securely remove patient records from the system.
  * **Pagination:** Navigate through large datasets with "Previous" and "Next" page controls.
  * **Responsive Design:** A clean and basic responsive layout powered by Tailwind CSS.

## 📦 Technologies Used

  * **Backend:**
      * [Node.js](https://nodejs.org/): JavaScript runtime.
      * [Express.js](https://expressjs.com/): Fast, unopinionated, minimalist web framework for Node.js.
      * [Axios](https://axios-http.com/): Promise-based HTTP client for the browser and Node.js, used for FHIR API interaction.
      * [CORS](https://www.npmjs.com/package/cors): Node.js package for providing a Connect/Express middleware that can be used to enable Cross-Origin Resource Sharing.
      * [dotenv](https://www.npmjs.com/package/dotenv): Loads environment variables from a `.env` file.
  * **Frontend:**
      * HTML5
      * CSS3 ([Tailwind CSS](https://tailwindcss.com/)): A utility-first CSS framework for rapid UI development.
      * JavaScript (Vanilla JS): Client-side scripting for dynamic interactions.
  * **FHIR Server:**
      * Configurable via `.env`, typically integrates with a public test server like `https://fhir-bootcamp.medblocks.com/fhir/` or `http://hapi.fhir.org/baseR4`.

## 🛠️ Setup and Installation

Follow these steps to get the application running on your local machine.

### Prerequisites

Ensure you have the following installed:

  * [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
  * [npm](https://docs.npmjs.com/cli/v7/commands/npm) (comes with Node.js)

### 1\. Project Structure

Make sure your project files are organized as follows:

```
patient-manager-app/
├── public/
│   ├── index.html
│   └── script.js
├── services/
│   └── fhirService.js
├── .env.example
├── package.json
└── server.js
```

### 2\. Install Dependencies

Navigate to the root directory of your project in your terminal and run the following command to install all necessary Node.js packages:

```bash
npm install express cors axios dotenv
```

### 3\. Configure Environment Variables

Create a file named `.env` in the root directory of your project. This file will store the base URL for the FHIR server you intend to use.

**Example `.env` file:**

```env
FHIR_BASE_URL=https://fhir-bootcamp.medblocks.com/fhir/
PORT=3000
```

  * You can also use `FHIR_BASE_URL=http://hapi.fhir.org/baseR4` for the public HAPI FHIR test server.
  * `PORT` is optional; it defaults to `3000` if not specified.

### 4\. Run the Application

Start the Node.js server from the root directory of your project:

```bash
node server.js
```

Upon successful startup, you will see output similar to this in your terminal:

```
Server running on http://localhost:3000
Open http://localhost:3000 in your browser to access the application.
```

### 5\. Access the Application

Open your web browser and navigate to the URL displayed in the console, typically:

```
http://localhost:3000
```

## 🖥️ Usage

### Viewing Patients

  * The application will automatically fetch and display a paginated list of the most recently updated patients upon loading.

### Searching for Patients

1.  Use the dropdown next to the search bar to select your desired search criterion (e.g., `Name`, `Phone`, `Date of Birth`, `ID`).
2.  Enter your search term in the input field.
3.  Click the "Search" button.

### Creating a New Patient

1.  Click the "Create New Patient" button located above the patient list. This will toggle the visibility of the patient input form.
2.  Fill in the required fields (First Name, Last Name, Gender) and any optional details.
3.  Click the "Submit Patient" button within the form.

### Updating an Existing Patient

1.  Locate the patient you wish to edit in the patient list.
2.  Click the "Edit" button in that patient's row.
3.  The patient form at the top of the page will automatically populate with the selected patient's current details. The form title and submit button text will change to indicate "Update Patient" mode.
4.  Make your desired modifications to the patient's information.
5.  Click the "Update Patient" button to save your changes.
6.  To discard changes and revert the form to "Create New Patient" mode, click the "Cancel" button.

### Deleting a Patient

1.  Click the "Edit" button for the patient you want to delete. This will load their details into the form.
2.  Click the "Delete Patient" button, which becomes visible in "Update Patient" mode.
3.  Confirm the deletion when prompted.

### Navigating Pages

  * Use the "Previous" and "Next" buttons below the patient list to move between pages of patient results.
