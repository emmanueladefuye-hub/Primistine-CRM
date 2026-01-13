# Primistine Electric CRM - Frontend

This is the premium React application for the Primistine Electric CRM.

## Tech Stack
-   **React** (Vite)
-   **Tailwind CSS** (Styling)
-   **Framer Motion** (Animations)
-   **Recharts** (Data Visualization)
-   **Lucide React** (Icons)

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```
    *Note: If you encounter peer dependency warnings, use `npm install --legacy-peer-deps`.*

2.  **Start Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

3.  **Build for Production**
    ```bash
    npm run build
    ```

## Project Structure
-   `/src/layout`: Main dashboard layout with Sidebar.
-   `/src/pages`: Individual dashboard views (Executive, Sales, Projects).
-   `/src/components`: Reusable UI components.
-   `/src/lib`: Constants and helpers.

## Theme
The project uses a custom "Premium" theme defined in `tailwind.config.js`:
-   **Primary**: Royal Blue (`bg-premium-blue-900`)
-   **Accent**: Metallic Gold (`text-premium-gold-500`)
