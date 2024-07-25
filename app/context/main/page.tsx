'use client';

import React, { useEffect, useState , ChangeEvent } from 'react';

import { useRouter } from 'next/navigation';
import { jwtVerify, JWTPayload } from 'jose';

interface UserPayload extends JWTPayload {
  id: string;
  email: string;
  name: string; // Add the name field here
}

interface ExpenseRow {
  category: string;
  amount: number;  // Change amount to number
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
  const [user, setUser] = useState<UserPayload | null>(null);
  const router = useRouter();
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([{ category: '', amount: 0 }]);
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
    setExpenseRows([...expenseRows, { category: '', amount: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    const newExpenseRows = expenseRows.filter((_, i) => i !== index);
    setExpenseRows(newExpenseRows);
  };
  const handleSave = async () => {
    const userId = 'user_id_placeholder'; // Replace with actual user ID logic
    try {
      await fetch('/api/main', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, expenses: expenseRows }),
      });
    } catch (error) {
      console.error('An error occurred:', error);
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
