import React from 'react';
import { ReviewSection, ReviewField, ReviewPhotos } from '../universal/ReviewComponents';

export const UniversalReview = ({ data }) => (
    <div className="space-y-6">
        <ReviewSection title="CLIENT & PROJECT INFORMATION">
            <ReviewField label="Client Name" value={data.clientName} />
            <ReviewField label="Phone Number" value={data.phone} />
            <ReviewField label="Email" value={data.email} />
            <ReviewField label="Site Address" value={data.address} />
            {data.gps && <ReviewField label="GPS Coordinates" value={data.gps} />}
            <ReviewField label="Building Type" value={data.buildingType} />
            <ReviewField label="Property Ownership" value={data.ownership} />

            {data.ownership === 'Rented' && (
                <ReviewField label="Landlord Contact" value={data.landlordContact} />
            )}

            <ReviewField label="Building Structure" value={data.structure} />
            <ReviewField label="Audit Date" value={data.auditDate ? new Date(data.auditDate).toLocaleDateString() : 'N/A'} />
            <ReviewField label="Engineer Name" value={data.engineerName} />

            {data.photos?.length > 0 && (
                <ReviewPhotos photos={data.photos} title="Site Photos" />
            )}
        </ReviewSection>
    </div>
);
