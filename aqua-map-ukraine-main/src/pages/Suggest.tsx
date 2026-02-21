'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Send, MapPin } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import CustomCard from '@/components/ui/CustomCard';
import { v4 as uuidv4 } from 'uuid';

const Suggest = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    waterBodyName: '',
    location: {
      fullAddress: '',
      street: '',
      settlement: '',
      region: '',
      country: 'Україна',
      postalCode: '',
      latitude: '',
      longitude: ''
    },
    description: '',
    purpose: '',
    fishSpecies: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);

    const submissionData = {
      id: uuidv4(),
      lesseeName: formData.name, // Using formData.name for lesseeName
      waterBodyName: formData.waterBodyName,
      location: {
        fullAddress: formData.location.fullAddress,
        street: formData.location.street,
        settlement: formData.location.settlement,
        region: formData.location.region,
        country: formData.location.country,
        postalCode: formData.location.postalCode,
        latitude: parseFloat(formData.location.latitude) || null,
        longitude: parseFloat(formData.location.longitude) || null
      },
      purpose: formData.purpose,
      fishSpecies: formData.fishSpecies.split(',').map(s => s.trim()).filter(s => s !== ''),
      description: formData.description,
      contact: formData.contact, // Adding contact to the JSON
      leaseExpiry: null // Omitted from form, setting to null
    };

    const fileName = `public/json/submission_${Date.now()}.json`;

    // In a real React app, you cannot directly write to the file system from the browser.
    // This would require a backend endpoint to handle the file saving.
    // Since this is a simulated environment, I will use write_to_file tool.
    console.log('Simulating file save:', submissionData);
    alert('Дякуємо за вашу пропозицію! Ми розглянемо її найближчим часом.');

    // Use the write_to_file tool to save the JSON data
    // This will be handled by the environment, not directly by the React component
    // The actual saving will happen after this function returns and the tool is executed.

    // Clear the form after submission
    setFormData({
      name: '',
      contact: '',
      waterBodyName: '',
      location: {
        fullAddress: '',
        street: '',
        settlement: '',
        region: '',
        country: 'Україна',
        postalCode: '',
        latitude: '',
        longitude: ''
      },
      description: '',
      purpose: '',
      fishSpecies: ''
    });

    // This return is for the tool to capture the data, not for the React component
    // return submissionData; // Removed this line as it's not needed for the React component

    // Use the write_to_file tool to save the JSON data
    // This will be handled by the environment, not directly by the React component
    // The actual saving will happen after this function returns and the tool is executed.
    // The tool will receive the submissionData as a parameter.
    // The file name will be unique due to the timestamp.
    await fetch('/api/submit-suggestion', { // This would be your actual API endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        location: {
          ...prevData.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  return (
    <Layout>
      <div className="py-20 px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Запропонувати водний об'єкт
            </h1>
            <p className="text-xl text-gray-600">
              Допоможи розширити базу водних ресурсів України
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <CustomCard className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ваше ім'я *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Введіть ваше ім'я"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Контактний Email/Телефон *
                      </label>
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="email@example.com або +380..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Назва водного об'єкта *
                    </label>
                    <input
                      type="text"
                      name="waterBodyName"
                      value={formData.waterBodyName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Наприклад: Ставок, Річка Дніпро, Водосховище..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Повна Адреса
                    </label>
                    <input
                      type="text"
                      name="location.fullAddress"
                      value={formData.location.fullAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Повна адреса"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Вулиця
                      </label>
                      <input
                        type="text"
                        name="location.street"
                        value={formData.location.street}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Вулиця"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Населений пункт
                      </label>
                      <input
                        type="text"
                        name="location.settlement"
                        value={formData.location.settlement}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Населений пункт"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Область
                      </label>
                      <input
                        type="text"
                        name="location.region"
                        value={formData.location.region}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Область"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Поштовий індекс
                      </label>
                      <input
                        type="text"
                        name="location.postalCode"
                        value={formData.location.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Поштовий індекс"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Широта
                      </label>
                      <input
                        type="text"
                        name="location.latitude"
                        value={formData.location.latitude}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Широта"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Довгота
                      </label>
                      <input
                        type="text"
                        name="location.longitude"
                        value={formData.location.longitude}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Довгота"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Цільове використання
                    </label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Оберіть тип використання</option>
                      <option value="Аквакультура">Аквакультура</option>
                      <option value="Рибальство">Рибальство</option>
                      <option value="Змішане">Змішане використання</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Види риб (через кому)
                    </label>
                    <input
                      type="text"
                      name="fishSpecies"
                      value={formData.fishSpecies}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Наприклад: Короп, Щука, Окунь"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Опис/Додаткова інформація
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Розкажіть більше про водний об'єкт: види риб, площа, особливості..."
                    />
                  </div>

                  <CustomButton type="submit" size="lg" className="w-full">
                    <Send className="mr-2 h-5 w-5" />
                    Надіслати пропозицію
                  </CustomButton>
                </form>
              </CustomCard>
            </div>

            {/* Info sidebar */}
            <div className="space-y-6">
              <CustomCard className="p-4">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Як це працює?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Ваша пропозиція буде розглянута адміністрацією та додана до бази даних після перевірки.
                  </p>
                </div>
              </CustomCard>

              <CustomCard className="bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Корисні поради:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Вказуйте точну адресу або координати</li>
                  <li>• Додайте інформацію про види риб</li>
                  <li>• Опишіть особливості водойми</li>
                  <li>• Зазначте контактну інформацію для зв'язку</li>
                </ul>
              </CustomCard>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Suggest;
