import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Type operator is not valid!');
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError('Insufficient founds!');
    }

    const categoryRepository = getRepository(Category);

    let categoryCheck = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryCheck) {
      categoryCheck = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(categoryCheck);
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: categoryCheck,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
