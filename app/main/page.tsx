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
  amount: number | "";
  date: string;  // Change amount to number
}

interface Recommendation {
  message: string;
  category: string;
}
interface ExpenseData {
  id: number;
  category: string;
  amount: number;
  date: string;
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
  const [fetchedExpenses, setFetchedExpenses] = useState<ExpenseData[]>([]);

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

  const handleRemoveRow = (index:number) => {
    const newRows = [...expenseRows];
    newRows.splice(index, 1);
    setExpenseRows(newRows);
  };
  const handleSave = async () => {
    if (!user) {
        console.error("User data missing.");
        return;
    }
    if (expenseRows.some(expense => !expense.category || !expense.amount)) {
      setError('All fields must be filled out correctly.');
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
          throw new Error(`Error: ${data.message}` || 'Failed to save the expense');
        }

        setSuccessMessage('Expense successfully added!');
        setError(''); // Clear any previous errors
      } catch (error: any) {
        console.error('Failed to save expenses:', error);
        setError(error.message || 'Failed to save expenses');
        setSuccessMessage(''); // Clear any previous success messages
    }
};
  const showCurrentExpenses = async (): Promise<void> => {
    try {
      const response = await fetch('/api/main', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: user?.id
      
      });
      const expenses: ExpenseData[] = await response.json();
      if (!response.ok) throw new Error('Failed to fetch expenses');
      setFetchedExpenses(expenses);
    } catch (error: any) {
      setError('Error: Failed to load current expenses');
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
  
  useEffect(() => {
    if (user) { // Only run when there is a user
      showCurrentExpenses();
    }
  }, [user]); // Depend on user state
  useEffect(() => {
    console.log(fetchedExpenses);
  }, [fetchedExpenses])
  
  if (!user) {
    return <div>Loading...</div>;
  }



  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-lg font-semibold">Hello, {user.name}</h1>
      <h2 className="text-xl font-bold text-center mb-4">Optimize Your Expenses Today</h2>

      <div className="mb-6">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="py-3 px-6">Category</th>
              <th scope="col" className="py-3 px-6">Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            {expenseRows.map((expense, index) => (
              <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td className="py-4 px-6">
                  <select
                    value={expense.category}
                    onChange={(e) => {
                      const newRows = [...expenseRows];
                      newRows[index].category = e.target.value;
                      setExpenseRows(newRows);
                    }}
                    className="form-select block w-full mt-1 text-black" // Added text-black here
                  >
                    {categories.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </td>
                <td className="py-4 px-6">
                  <input
                    type="number"
                    value={expense.amount}
                    onChange={(e) => {
                      const newRows = [...expenseRows];
                      newRows[index].amount = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setExpenseRows(newRows);
                    }}
                    className="form-input mt-1 block w-full text-black" // Added text-black here
                    placeholder="Enter amount"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button onClick={handleAddRow} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add Expense
        </button>
        <button onClick={handleSave} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Save Expenses
        </button>
        <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Begin Analysis
        </button>
      </div>

      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      {successMessage && <p className="text-green-500 text-center mt-2">{successMessage}</p>}
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