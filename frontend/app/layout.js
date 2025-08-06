import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { ReduxProvider } from "../components/providers/ReduxProvider";

export const metadata = {
  title: "Video Editor - Next.js",
  description: "Professional video editing application built with Next.js and Redux",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
