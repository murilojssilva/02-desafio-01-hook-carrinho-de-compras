import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`/products/${productId}`);
      const findProductCart = cart.find(p => p.id === productId);

      if (findProductCart) {
        const amount = findProductCart.amount + 1
        return await updateProductAmount({
          productId,
          amount
        });
      }

      const amount = 1;
      const newCart = [...cart, { amount, ...data }];
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na adição do produto');
      toast.error('Quantidade solicitada fora de estoque');
    }

  };

  const removeProduct = (productId: number) => {
    try {

      const findProduct = [...cart].find(p => p.id === productId);

      if (!findProduct) {
        return toast.error('Erro na remoção do produto');
      }


      const removeProduct = [...cart].filter(p => {
        return p["id"] !== productId;
      })

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(removeProduct));
      setCart(removeProduct);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const Stock = await api.get(`/stock/${productId}`);


      if (amount > Stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (amount < 1) {
        return;
      }



      const updateAmountProduct = [...cart].filter(p => {
        if (p.id === productId) {
          p.amount = amount;
        }

        return p;
      })

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateAmountProduct));
      setCart(updateAmountProduct);


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
