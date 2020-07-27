import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
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

    const transctionsCategory = getRepository(Category);

    let categoryCheck = await transctionsCategory.findOne({
      where: { title: category },
    });

    if (!categoryCheck) {
      categoryCheck = transctionsCategory.create({
        title: category,
      });

      await transctionsCategory.save(categoryCheck);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryCheck,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
