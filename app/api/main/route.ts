import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Define TypeScript interfaces for request and response data
interface Expense {
  category: string;
  amount: number;
  date?: string;
}

interface SaveExpensesRequest {
  userId: string;
  expenses: Expense[];
}

interface SaveExpensesResponse {
  success: boolean;
  message?: string;
}

interface ExpensesData {
    userId: string;
    expenses: Expense[];
}
export async function POST(request: Request) {
    try {
    const {expenses, userId} = await request.json();
          
    console.log("Received expenses:", expenses);
    console.log("Received user id: ", userId)
    
    const expensesWithUserId: ExpensesData[] = expenses.map((expense: Expense) => ({
        ...expense,  // Spread the existing properties of the expense
        user_id: userId  // Add the userId to each expense object
    }));
  
      const { data, error } = await supabase
        .from('expenses')
        .insert(expensesWithUserId)

  
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
  
      console.log('Expenses inserted successfully:', data);
      return NextResponse.json({ success: true }, { status: 201 });
  
    } catch (error) {
      console.error('Failed to process request:', error);
      return NextResponse.json({ success: false, message: 'Failed to process request' }, { status: 500 });
    }
  }
export async function GET(request: Request) {
  try {
    const userId = await request.json();
    console.log(userId);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch expenses' }, { status: 500 });
  }
}
