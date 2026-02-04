'use client'
 
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button';

const Page = () => {
    const {id} = useParams();
    return <div className="bg-red-300 text-2xl">Menu Page {id}
          <Button className='bg-amber-200'  appName='click'>Click me</Button>
    </div>;
}

export default Page;