import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  public async execute(): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.findOne({
      where: { id: this.id },
    });

    if (!transaction) {
      throw new AppError('Transaction not found!');
    }
    await transactionsRepository.delete(this.id);
  }
}

export default DeleteTransactionService;
