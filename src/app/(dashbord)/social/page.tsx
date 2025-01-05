"use client"
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

const SocialMidia = () => {
    const [socialLinks, setSocialLinks] = useState({
        insta: { url: '', active: false },
        face: { url: '', active: false },
        tiktok: { url: '', active: false },
        whats: { url: '', active: false },
        youtube: { url: '', active: false }
    });

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        const fetchSocialLinks = async () => {
            if (userId) {
                const userDocRef = doc(db, "usuario", userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setSocialLinks(data.social || socialLinks);
                }
            }
        };
        fetchSocialLinks();
    }, [userId]);

    const handleSocialLinkChange = async (platform: 'insta' | 'face' | 'tiktok' | 'whats' | 'youtube', field: 'url' | 'active', value: string | boolean) => {
       
        setSocialLinks(prevLinks => ({
            ...prevLinks,
            [platform]: {
                ...prevLinks[platform],
                [field]: value
            }
        }));

        if (userId) {
            const userDocRef = doc(db, "usuario", userId);
            await updateDoc(userDocRef, {
                [`social.${platform}.${field}`]: value
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
                <h2 className="text-xl font-semibold mb-6">Habilitar redes sociais</h2>
                <div className="space-y-4">
                    {Object.entries(socialLinks).map(([platform, data]) => (
                        <div key={platform} className="flex items-center space-x-4">
                            <span className="w-24 capitalize">{platform}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.active}
                                    onChange={(e) => handleSocialLinkChange(platform as 'insta' | 'face' | 'tiktok' | 'whats' | 'youtube', 'active', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                            <input
                                type="text"
                                placeholder={`Enter ${platform} link`}
                                value={data.url}
                                onChange={(e) =>
                                    handleSocialLinkChange(platform as "insta" | "face" | "tiktok" | "whats" | "youtube", "url", e.target.value)
                                }
                                className="flex-1 p-2 border border-gray-300 rounded"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SocialMidia;