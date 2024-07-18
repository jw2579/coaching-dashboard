import React, { useEffect, useState } from 'react';
import { Card, Row } from 'react-bootstrap';
import HealthSpanSingleItem from './HealthSpanSingleItem';
import { cloneDeep } from 'lodash';
import {
  defaultHealthSpanData,
  defaultHealthSpanMappings
} from '../../../../data/dashboard/clientAnalytics';

const HealthSpanCards = ({ healthSpanData, activeClientId, apiKey, sessionId }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (activeClientId) {
        try {
          const response = await fetch(
              `https://aspihealth.com/api/coaching/get-user-profile/?apiKey=${apiKey}&sessionId=${sessionId}&userId=${activeClientId}`
          );
          const data = await response.json();
          setProfile(data);
        } catch (err) {
          console.error('Error fetching client profile:', err);
        }
      }
    };

    fetchProfile();
  }, [activeClientId, apiKey, sessionId]);

  const calculateAge = (dateOfBirth) => {
    const birthday = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  };

  const setVisualCues = (templateItem, score, isBiologicalAge = false) => {
    if (isBiologicalAge && profile) {
      const chronologicalAge = calculateAge(profile.dateOfBirth);
      templateItem.chartColor = score > chronologicalAge ? '#C63A47' : '#5A8839'; // Red for higher biological age, Green for lower
    } else {
      if (score < 50) {
        templateItem.chartColor = '#C63A47'; // Red
      } else if (score >= 50 && score < 80) {
        templateItem.chartColor = '#E69500'; // Orange
      } else {
        templateItem.chartColor = '#5A8839'; // Green
      }
    }
  };

  const updateTemplateItem = (templateItem, item, apiField) => {
    const score = item[apiField];
    templateItem.dataArray.push(score);
    const formattedDate = `${new Date(item.date).getMonth() + 1}/${new Date(item.date).getDate()}`;
    templateItem.xAxis.push(formattedDate);

    const isBiologicalAge = apiField === 'biologicalAge';
    setVisualCues(templateItem, score, isBiologicalAge);

    templateItem.count = score.toFixed(1).toString();
  };

  const formatHealthSpanData = (data) => {
    let formattedData = cloneDeep(defaultHealthSpanData);

    data.items.sort((a, b) => new Date(a.date) - new Date(b.date));

    data.items.forEach((item) => {
      Object.entries(defaultHealthSpanMappings).forEach(([apiField, title]) => {
        const templateItem = formattedData.find((t) => t.title === title);
        if (templateItem && item[apiField] !== null) {
          updateTemplateItem(templateItem, item, apiField);
        }
      });
    });
    return formattedData;
  };

  return (
      <Card className="h-100">
        <Card.Body>
          <Row className="g-0">
            {formatHealthSpanData(healthSpanData).map(item => (
                <HealthSpanSingleItem key={item.title} singleData={item} />
            ))}
          </Row>
        </Card.Body>
      </Card>
  );
};

export default HealthSpanCards;
