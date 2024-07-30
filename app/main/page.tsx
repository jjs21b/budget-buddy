'use client';

import React, { useEffect, useState , ChangeEvent } from 'react';
import { buffer } from 'micro';
import { useRouter } from 'next/navigation';
import { jwtVerify, JWTPayload } from 'jose';

interface UserPayload extends JWTPayload {
  id: string;
  email: string;
  name: string; // Add the name field here
}

interface ExpenseRow {
  category: string;
  amount: number;
  date: string;  // Change amount to number
}

interface Recommendation {
  message: string;
  category: string;
}
const categories = [
  'Rent',
  'Utilities',
  'Groceries',
  'Transportation',
  'Entertainment',
  'Dining Out',
  'Healthcare',
  'Education',
  'Other',
];

const MainPage = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<UserPayload | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([{ category: '', amount: 0, date: ''}]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const handleCategoryChange = (index: number, value: string) => {
    const newExpenseRows = [...expenseRows];
    newExpenseRows[index].category = value;
    setExpenseRows(newExpenseRows);
  };

  const handleAmountChange = (index: number, value: number) => {
    const newExpenseRows = [...expenseRows];
    newExpenseRows[index].amount = value;
    setExpenseRows(newExpenseRows);
  };

  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0];
    setExpenseRows([...expenseRows, { category: '', amount: 0 , date: today}]);
  };

  const handleRemoveRow = (index: number) => {
    const newExpenseRows = expenseRows.filter((_, i) => i !== index);
    setExpenseRows(newExpenseRows);
  };
  const handleSave = async () => {
    if (!user) {
        console.error("User data missing.");
        return;
    }
    const isValid = expenseRows.every(expense => expense.amount > 0 && categories.includes(expense.category.trim()) && 
    expense.category.trim() !== '');
    
    console.log(`valid ${isValid}`);
    if (!isValid){
      setError('All expenses must have a valid number for amount and a non-empty category');
      setSuccessMessage('');
      return;
    }

    // Preparing the data structure to match the required JSON format
    const payload = {
        userId: user.id,  // Assuming user object has an 'id' property
        expenses: expenseRows.map(expense => ({
            category: expense.category,
            amount: expense.amount,
            date: expense.date || new Date().toISOString().split('T')[0] // Default to current date if not provided
        }))
    };

    try {
        const response = await fetch('/api/main', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload) // Convert the payload to JSON string
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save the expense');
        }

        setSuccessMessage('Expense successfully added!');
        setError(''); // Clear any previous errors
      } catch (error: any) {
        console.error('Failed to save expenses:', error);
        setError(error.message || 'Failed to save expenses');
        setSuccessMessage(''); // Clear any previous success messages
    }
};
  
  
  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (token) {
      const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

      jwtVerify(token, secret)
        .then(({ payload }) => {
          const userPayload: UserPayload = payload as UserPayload;
          if (userPayload.id && userPayload.email && userPayload.name) {
            setUser(userPayload);
          } else {
            throw new Error('Invalid token payload');
          }
        })
        .catch((err) => {
          console.error('Invalid token:', err);
          router.push('/');
        });
    } else {
      router.push('/');
    }
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }



  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold">Hello, {user.name}</h1> {/* Displays user-specific information */}
      <h1 className="text-4xl font-bold mb-6">Optimize Your Expenses Today</h1>
      <table className="w-full max-w-4xl mb-6 bg-white rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Amount ($)</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {expenseRows.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">
                <input
                  type="text"
                  list={`category-options-${index}`}
                  value={row.category}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleCategoryChange(index, e.target.value)}
                  className="text-black w-full px-2 py-1 border rounded-md focus:ring focus:ring-opacity-50 focus:ring-blue-500 focus:outline-none"
                />
                <datalist id={`category-options-${index}`}>
                  {categories.map((category, i) => (
                    <option key={i} value={category} />
                  ))}
                  <option value="Other">Other</option>
                </datalist>
              </td>
              <td className="border px-4 py-2">
                <input
                  type="number"
                  value={row.amount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleAmountChange(index, parseFloat(e.target.value))}
                  className="text-black w-full px-2 py-1 border rounded-md focus:ring focus:ring-opacity-50 focus:ring-blue-500 focus:outline-none"
                />
              </td>
              <td className="border px-4 py-2">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button
        type="button"
        onClick={handleAddRow}
        className="mb-6 px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-700"
      >
        Add Expense
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-700"
      >
        Save Expenses
      </button>

      <h2 className="text-2xl font-bold mt-6">Financial Recommendations</h2>
      <ul className="mt-4">
        {recommendations.map((rec, index) => (
          <li key={index} className="mb-2">
            {rec.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MainPage;
[
  {
      "user_id": "a1bfe1ac-e856-407e-a8bd-d2780a9cde9d",
      "category": "Groceries",
      "amount": 20,
      "date": "2024-07-24"
  }
]