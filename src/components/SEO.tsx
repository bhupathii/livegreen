import { useEffect } from "react";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
}

export default function SEO({ title, description, keywords }: SEOProps) {
    useEffect(() => {
        if (title) {
            document.title = title;
        }

        if (description) {
            try {
                let metaDescription = document.querySelector('meta[name="description"]');
                if (!metaDescription) {
                    metaDescription = document.createElement("meta");
                    metaDescription.setAttribute("name", "description");
                    document.head.appendChild(metaDescription);
                }
                metaDescription.setAttribute("content", description);
            } catch (e) {
                console.error("SEO: Error updating description meta tag", e);
            }
        }

        if (keywords) {
            try {
                let metaKeywords = document.querySelector('meta[name="keywords"]');
                if (!metaKeywords) {
                    metaKeywords = document.createElement("meta");
                    metaKeywords.setAttribute("name", "keywords");
                    document.head.appendChild(metaKeywords);
                }
                metaKeywords.setAttribute("content", keywords);
            } catch (e) {
                console.error("SEO: Error updating keywords meta tag", e);
            }
        }

        return () => {
            // Optional: reset to default on unmount, if desired.
        };
    }, [title, description, keywords]);

    return null;
}
