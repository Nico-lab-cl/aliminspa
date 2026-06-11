'use client'

import { useEffect } from 'react'
import { trackMetaEvent } from '@/lib/track'

interface Props {
    eventName?: string;
    customData?: any;
}

/**
 * Client component to track page views and other automatic events
 * using Meta Conversions API.
 */
export default function MetaTrackPageView({ 
    eventName = 'ViewContent', 
    customData = {} 
}: Props) {
    useEffect(() => {
        // We Use a small delay to ensure cookies (fbp/fbc) are set if this is the first hit
        const timer = setTimeout(() => {
            trackMetaEvent(eventName, {}, customData);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [eventName, JSON.stringify(customData)]);

    return null;
}
